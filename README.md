This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Admin Order Push Notifications (Works When Site Is Closed)

This project supports background admin order notifications via Web Push.

1. Install dependencies:
```bash
npm install
```

2. Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

3. Add these env vars to `.env.local`:
```env
PB_ADMIN_EMAIL=your_pocketbase_superuser_email
PB_ADMIN_PASSWORD=your_pocketbase_superuser_password
WEB_PUSH_SUBJECT=mailto:you@example.com
WEB_PUSH_PUBLIC_KEY=generated_public_key
WEB_PUSH_PRIVATE_KEY=generated_private_key
NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=generated_public_key
```

4. In PocketBase, create collection `admin_push_subscriptions` with fields:
- `adminUserId` (text)
- `endpoint` (text, unique)
- `p256dh` (text)
- `auth` (text)

5. Login as admin, open dashboard, and enable "Notifications commandes".

Notes:
- Push requires HTTPS in production (localhost works in development).
- If env vars or collection are missing, in-page polling notifications still work while admin pages are open.
