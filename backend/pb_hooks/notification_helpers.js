function jsonValue(record, field, fallback) {
  const raw = record.getString(field)
  return typeof raw === 'string' ? (raw ? JSON.parse(raw) : fallback) : (raw ?? fallback)
}

module.exports = {
  enqueue(app, kind, key, recipient, subject, text, extra) {
    const existing = app.findRecordsByFilter('notification_jobs', 'dedupeKey = {:key}', '', 1, 0, { key })
    if (existing.length) return
    const job = new Record(app.findCollectionByNameOrId('notification_jobs'))
    job.set('kind', kind); job.set('dedupeKey', key); job.set('recipient', recipient || '')
    job.set('payload', Object.assign({ subject: String(subject).slice(0, 200), text: String(text).slice(0, 8000) }, extra || {})); job.set('status', 'queued'); job.set('attempts', 0)
    app.save(job)
  },
  order(app, order, kind) {
    const amount = kind === 'refund' ? order.getInt('refundedAmountCents') : order.getInt('paymentAmountCents')
    const subject = kind === 'receipt' ? 'Payment received' : kind === 'shipment' ? 'Your order has shipped' : 'Refund confirmed'
    let text = subject + '\nOrder reference: ' + order.id + '\n'
    if (kind === 'shipment') text += 'Carrier: ' + order.getString('trackingCarrier') + '\nTracking: ' + order.getString('trackingNumber')
    else text += 'Amount: USD ' + (amount / 100).toFixed(2)
    if (kind === 'receipt') {
      const items = jsonValue(order, 'items', [])
      const money = cents => Number.isSafeInteger(cents) && cents >= 0 ? 'USD ' + (cents / 100).toFixed(2) : 'Unavailable'
      for (const item of items) text += '\n' + String(item.quantity) + ' × ' + String(item.name || 'Item').slice(0, 100) + ' — ' + money(item.unitPriceCents) + ' each; ' + money(item.lineSubtotalCents)
      text += '\n\nSubtotal: ' + money(order.getInt('subtotalCents')) + '\nDiscount: -' + money(order.getInt('discountCents')) + '\nItems after discount: ' + money(order.getInt('itemsTotalCents')) + '\nShipping: ' + money(order.getInt('shippingCents')) + '\nTax: ' + money(order.getInt('taxCents')) + '\nTotal paid: ' + money(amount)
    }
    this.enqueue(app, kind, kind + ':' + order.id, order.getString('email'), subject + ' — Chia Charged', text, { orderId: order.id })
  },
  run(app) {
    // A crashed worker may have handed mail to SMTP. Never automatically resend an expired claim.
    const stale = app.findRecordsByFilter('notification_jobs', 'status = "processing" && updated < {:before}', '', 50, 0, { before: new Date(Date.now() - 15 * 60000).toISOString() })
    for (const job of stale) { job.set('status', 'uncertain'); job.set('lastError', 'Worker stopped during delivery. Check mail logs before retrying.'); app.save(job) }
    const jobs = app.findRecordsByFilter('notification_jobs', '(status = "queued" || status = "retry" || status = "blocked_configuration") && (nextAttemptAt = "" || nextAttemptAt <= {:now})', 'created', 20, 0, { now: new Date().toISOString() })
    for (const candidate of jobs) {
      let job = null
      app.runInTransaction(tx => {
        const current = tx.findRecordById('notification_jobs', candidate.id)
        if (!['queued', 'retry', 'blocked_configuration'].includes(current.getString('status'))) return
        const due = current.getString('nextAttemptAt')
        if (due && Date.parse(due) > Date.now()) return
        current.set('status', 'processing'); tx.save(current); job = current
      })
      if (!job) continue
      let accepted = false
      const initialAttempts = job.getInt('attempts')
      try {
        const settings = app.settings()
        let recipient = job.getString('recipient')
        if (job.getString('kind') === 'support_message') recipient = app.findRecordById('store_settings', 'storeconfig0001').getString('supportEmail')
        if ($os.getenv('CHIA_MAIL_ENABLED') !== 'true' || !settings.smtp.enabled || !settings.meta.senderAddress || !recipient) {
          job.set('status', 'blocked_configuration'); job.set('lastError', 'Enable CHIA_MAIL_ENABLED, configure SMTP/sender and recipient.'); job.set('nextAttemptAt', new Date(Date.now() + 5 * 60000).toISOString()); app.save(job); continue
        }
        let payload = jsonValue(job, 'payload', {})
        if (job.getString('kind') === 'support_message' && payload.supportMessageId) {
          const message = app.findRecordById('support_messages', payload.supportMessageId)
          payload = { subject: 'Support: ' + message.getString('subject'), text: 'From: ' + message.getString('name') + ' <' + message.getString('email') + '>\n\n' + message.getString('message') }
        }
        if (typeof payload.text !== 'string' || typeof payload.subject !== 'string') { job.set('status', 'failed'); job.set('lastError', 'Invalid notification payload.'); app.save(job); continue }
        let emailText = payload.text
        if (job.getString('kind') === 'receipt' && payload.orderId) {
          const origin = String($os.getenv('CHIA_PUBLIC_APP_URL') || '').replace(/\/$/, '')
          if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin)) {
            job.set('status', 'blocked_configuration'); job.set('lastError', 'Set CHIA_PUBLIC_APP_URL to the HTTPS storefront origin.'); job.set('nextAttemptAt', new Date(Date.now() + 5 * 60000).toISOString()); app.save(job); continue
          }
          const order = app.findRecordById('orders', payload.orderId)
          if (!order.getString('user')) {
            if (!payload.guestToken) {
              payload.guestToken = $security.sha256($security.randomString(64))
              app.runInTransaction(tx => {
                const current = tx.findRecordById('orders', order.id)
                current.set('emailAccessHash', $security.sha256(payload.guestToken))
                current.set('emailAccessExpires', new Date(Date.now() + 7 * 86400000).toISOString())
                tx.save(current); job.set('payload', payload); tx.save(job)
              })
            }
            emailText += '\n\nView your order (link expires in 7 days; keep it private):\n' + origin + '/order-access#id=' + order.id + '&token=' + payload.guestToken
          } else emailText += '\n\nSign in to view your order:\n' + origin + '/checkout/confirmation?id=' + order.id + '&recovery=1'
        }
        job.set('recipient', recipient); job.set('attempts', job.getInt('attempts') + 1); app.save(job)
        const escaped = emailText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        app.newMailClient().send(new MailerMessage({ from: { address: settings.meta.senderAddress, name: settings.meta.senderName }, to: [{ address: recipient }], subject: payload.subject.replace(/[\r\n]/g, ' '), text: emailText, html: '<pre style="white-space:pre-wrap">' + escaped + '</pre>' }))
        accepted = true
        job.set('status', 'sent'); job.set('sentAt', new Date().toISOString()); job.set('lastError', ''); job.set('nextAttemptAt', ''); app.save(job)
      } catch {
        job.set('attempts', Math.max(job.getInt('attempts'), initialAttempts + 1))
        job.set('status', accepted ? 'uncertain' : job.getInt('attempts') >= 5 ? 'failed' : 'retry')
        job.set('lastError', 'Delivery failed. Check SMTP configuration and server mail logs.')
        job.set('nextAttemptAt', new Date(Date.now() + Math.min(3600, 60 * Math.pow(2, job.getInt('attempts'))) * 1000).toISOString())
        app.save(job)
      }
    }
    return { processed: jobs.length }
  },
}
