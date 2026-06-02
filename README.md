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

## Environment

Copy `.env.example` to `.env.local` in the repository root and fill the values before running locally.

Required variables used by the app:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key used by browser, middleware and server clients.

Do not create per-app env files such as `app/.env.local`; Next reads env files from the project root. Keep `.env.local` out of Git. If any local value was ever committed or shared, rotate it in the provider dashboard before deploying.

CI runs `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run audit:prod` and `npm test` on pushes and PRs. The route smoke test uses dummy Supabase env values only to verify unauthenticated route behavior.

## Dependency Policy

Apply patch/minor upgrades first and verify them with lint, typecheck, build, production audit and smoke tests. Major upgrades such as Next 16 should be handled in a dedicated migration branch.

`package.json` currently overrides Next's nested `postcss` to `8.5.10` so `npm run audit:prod` can enforce the moderate production-audit threshold without downgrading Next.
