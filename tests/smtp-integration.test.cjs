const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { once } = require('node:events');
const PocketBase = require('pocketbase/cjs');

test('PocketBase sends support and account mail to local SMTP and retries rejected delivery', { timeout: 30000 }, async () => {
  const received = [];
  const sockets = new Set();
  let rejectRecipient = false;
  // Local protocol sink only: captures synthetic mail and never relays it.
  const smtp = net.createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket));
    let buffer = '', inData = false, body = '', recipient = '';
    socket.setEncoding('utf8'); socket.write('220 localhost QA SMTP\r\n');
    socket.on('data', chunk => {
      buffer += chunk;
      while (buffer.includes('\r\n')) {
        const end = buffer.indexOf('\r\n');
        const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
        if (inData) {
          if (line === '.') { received.push({ recipient, body }); inData = false; body = ''; socket.write('250 accepted\r\n'); }
          else body += line + '\r\n';
        } else if (/^(EHLO|HELO)/i.test(line)) socket.write('250 localhost\r\n');
        else if (/^RCPT TO:/i.test(line)) { recipient = line; socket.write(rejectRecipient ? '550 rejected for test\r\n' : '250 OK\r\n'); }
        else if (/^DATA$/i.test(line)) { inData = true; socket.write('354 end with dot\r\n'); }
        else if (/^QUIT$/i.test(line)) socket.end('221 bye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  smtp.listen(0, '127.0.0.1'); await once(smtp, 'listening');
  try {
    const pb = new PocketBase(process.env.SHIPPING_TEST_URL); pb.autoCancellation(false);
    await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
    await pb.settings.update({ smtp: { enabled: true, host: '127.0.0.1', port: smtp.address().port, tls: false, username: '', password: '', authMethod: '' }, meta: { senderName: 'QA Store', senderAddress: 'store@example.test' } });
    await pb.collection('store_settings').update('storeconfig0001', { supportEmail: 'support@example.test' });
    async function support(message) {
      const result = await pb.send('/api/chia-support/submit', { method: 'POST', body: { name: 'QA Sender', email: 'sender@example.test', purpose: 'general', subject: 'QA delivery', message } });
      await pb.send('/api/chia-notifications/run', { method: 'POST' });
      return pb.collection('notification_jobs').getFirstListItem(pb.filter('dedupeKey = {:key}', { key: 'support:' + result.id }));
    }
    const delivered = await support('Synthetic SMTP handover test');
    assert.equal(delivered.status, 'sent');
    assert.equal(received.length, 1);
    assert.match(received[0].recipient, /support@example\.test/);
    assert.match(received[0].body, /Subject: QA delivery|Subject: Support: QA delivery/);
    const order = await pb.collection('orders').create({ email: 'buyer@example.test', isGuest: true, paymentStatus: 'paid', paymentAmountCents: 2500, subtotalCents: 2000, itemsTotalCents: 2000, shippingCents: 500, taxCents: 0, items: [{ name: 'QA pudding', quantity: 2, unitPriceCents: 1000, lineSubtotalCents: 2000 }] });
    await pb.send('/__test/receipt', { method: 'POST', body: { id: order.id } });
    await pb.send('/api/chia-notifications/run', { method: 'POST' });
    const receipt = await pb.collection('notification_jobs').getFirstListItem(pb.filter('dedupeKey = {:key}', { key: 'receipt:' + order.id }));
    assert.equal(receipt.status, 'sent');
    assert.match(receipt.payload.text, /2 × QA pudding — USD 10.00 each; USD 20.00/);
    assert.match(receipt.payload.guestToken, /^[a-f0-9]{64}$/);
    assert.ok(received.some(mail => mail.recipient.includes('buyer@example.test')));
    await pb.collection('users').create({ email: 'account@example.test', password: 'Synthetic-Account-123!', passwordConfirm: 'Synthetic-Account-123!', role: 'customer', isActive: true });
    await pb.collection('users').requestVerification('account@example.test');
    await pb.collection('users').requestPasswordReset('account@example.test');
    // Native account mail is dispatched asynchronously after the API responds.
    for (let attempt = 0; attempt < 50 && received.filter(mail => mail.recipient.includes('account@example.test')).length < 2; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(received.filter(mail => mail.recipient.includes('account@example.test')).length, 2);
    rejectRecipient = true;
    const rejected = await support('Synthetic SMTP rejection test');
    assert.equal(rejected.status, 'retry');
    assert.equal(rejected.attempts, 1);
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => smtp.close(resolve));
  }
});
