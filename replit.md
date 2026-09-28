# Proniqa Gift & Jewellery Store

Proniqa is a warm, editorial storefront for artificial jewellery, customised photo frames, gifts, and keepsakes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/proniqa-store/src/App.tsx` — storefront UI, cart, account, order request, and custom-frame enquiry flows.
- `artifacts/proniqa-store/src/lib/firebase.ts` — Firebase app initialization and typed Auth, Firestore, and Storage helpers.
- `artifacts/proniqa-store/public/images/` — Proniqa product and editorial imagery.
- `artifacts/proniqa-store/src/index.css` — Proniqa visual theme, typography, texture, and motion system.

## Architecture decisions

- Firebase browser config is injected through `VITE_FIREBASE_*` environment variables rather than committed to source.
- The storefront keeps curated fallback products so the page remains presentable while the Firestore `products` collection is empty.
- Order requests are saved to Firestore and frame photos are uploaded to Firebase Storage before the enquiry document is created.
- Checkout intentionally saves an order request; payment provider integration can be added separately without changing the Firebase data model.

## Product

- Browse and filter jewellery, personalised frames, and gifting products.
- Search products, wishlist items, add products to a cart, and submit an order request.
- Create/sign into a customer account with Firebase Auth.
- Submit a customised-frame enquiry with an optional photo upload through Firebase Storage.

## User preferences

- The user wants Proniqa to feel very attractive and focused on artificial jewellery, customised photo frames, gifts, and similar keepsakes.

## Gotchas

- Firebase Console must have Email/Password Auth enabled, Firestore and Storage created, and rules configured for the `products`, `orders`, `enquiries`, and `frame-enquiries` paths.
- Firebase web config values are public browser configuration, but service-account JSON/private keys must never be added to the client app.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
