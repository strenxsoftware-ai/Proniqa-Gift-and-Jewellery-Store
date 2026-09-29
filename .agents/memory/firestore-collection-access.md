---
name: Firestore collection access
description: Public catalog collections are read directly by the browser and need collection-specific Firestore read rules.
---

Each public catalog collection used by the storefront needs its own explicit read rule. Adding a client subscription and field mapper is not enough; Firestore returns `permission-denied` until the collection is covered by rules.

**Why:** The storefront reads catalog data directly from Firebase in the browser, so missing collection rules fail before mapping or rendering can occur.

**How to apply:** For a public catalog, add a read rule for each catalog collection (for example `products` and `frames`) while keeping writes restricted. Review security requirements before making a collection public.