# 01: Shop module foundation

**What to build:** consolidare `customers` e `orders` sotto il modulo `shop` e predisporre le fondamenta condivise (scheletro del modulo, permesso mancante) senza cambiare alcun comportamento. È il prefactor che apre il resto del lavoro.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] `customers` e `orders` vivono sotto `src/modules/shop/`; import, registrazione dei router e test aggiornati; admin Customers/Orders invariati e funzionanti.
- [x] Aggiunto `PRODUCT_CATEGORIES_PUBLISH: "product-categories.publish"` a `PERMISSIONS` e coperto dal mapping dell'autorizzazione.
- [x] Espansione/contrazione sicura: nessun call-site rotto, `npx vitest run` (customers/orders), `npx tsc --noEmit` e lint verdi.

## Comments

Delivered:

- Spostati `src/modules/customers` e `src/modules/orders` in `src/modules/shop/customers` e `src/modules/shop/orders` con `git mv` (rename puri). Aggiornati gli import in `src/trpc/routers/_app.ts`, nelle route admin customers/orders, in `src/modules/automations/{server/automation-runtime.ts,editor/config/{node-catalog.ts,node-config-panels.tsx}}` e nei test; le chiavi tRPC `customers`/`orders` restano invariate.
- Aggiunto `PRODUCT_CATEGORIES_PUBLISH: "product-categories.publish"` a `PERMISSIONS`. Il mapping `getProcedurePermissions("productCategories.publish")` risolve a `product-categories.publish` tramite l'alias `productCategories → product-categories` e il ramo publish.
- Migration `20261006120000_add_product_categories_publish_permission`: registra la chiave nel catalogo data-driven e la assegna al ruolo ADMIN in modo idempotente, così `permissionProcedure` potrà usarla nel ticket 03.
- Coverage: `src/modules/shop/__tests__/permissions.test.ts` (chiave a catalogo + assegnata ad ADMIN) e un caso in `src/shared/lib/authorization.test.ts` per il mapping.
- Verified: `npx vitest run` (84 file, 638 test verdi), `npx tsc --noEmit` pulito, eslint pulito sui file toccati. Il lint di repo resta rosso per errori preesistenti non correlati a questo ticket.
