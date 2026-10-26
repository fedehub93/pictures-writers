# Lazy-load form element properties in the public bundle

The form builder registry imports every form element through a single `index.tsx` per element. Each `index.tsx` exports the designer component, the properties component, the public form component, the schema builder, and the initial-value helper. The public runner needs only the form component, schema builder, and initial-value helper, but because the properties component is part of the same module, it is bundled with the runner. The properties component for rich fields imports TipTap/ProseMirror, which adds roughly 356 KB to the public bundle even on pages that never render a form.

We decided to keep a single registry and lazy-load the properties component inside each element's `index.tsx`. This keeps TipTap out of the public runner chunk while preserving the existing designer behavior. We rejected a separate runner registry because it would duplicate element lists, introduce new types, and require updating every helper that consumes the registry. We also rejected wrapping the whole runner in `next/dynamic` because it would leave the underlying coupling intact and force future developers to remember the workaround for every new consumer.

Consequences: every new form element must lazy-load its properties component; the admin designer pays a small lazy-load cost when opening a properties panel; the public bundle shrinks significantly.

## Considered options

- **Separate runner registry**: cleaner separation but medium complexity and ongoing maintenance of two registries.
- **Dynamic import of the whole runner**: quick win but does not fix the registry design.
- **Lazy import of properties components**: best balance of bundle reduction and maintainability.

## Consequences

- TipTap is removed from initial public page bundles.
- The registry stays a single source of truth.
- Element authors must follow the lazy-properties pattern.
