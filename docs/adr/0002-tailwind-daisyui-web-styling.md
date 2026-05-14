# Tailwind and daisyUI for web styling

Inti will adopt Tailwind CSS and daisyUI as the canonical styling system for the embedded web frontend, replacing the current bespoke theme and component styling with a shared component foundation that still preserves the existing **Text Workspace** product behavior. As part of that decision, the product-facing **Visual Theme** model is intentionally collapsed from `light`, `dark`, `minimal`, and `minimal-dark` to exactly `light` and `dark`, with `dark` as the default from first paint onward and no backward compatibility for removed historical theme values. We chose this because the current hybrid styling stack is expensive to evolve, the theme model is more complex than the product needs, and a future reader would not be able to infer from the code alone that the break from the four-theme model was deliberate rather than accidental.

## Consequences

- New web work should use Tailwind CSS and daisyUI primitives first, keeping `web/style.css` only as a compatibility layer for older shared elements and icon plumbing that has not yet moved.
- Persisted **Visual Theme** values are now a deliberate product contract: `light` and `dark` only.
- Missing, invalid, or historical theme values are treated as `dark` at runtime instead of preserving backward compatibility.
- Documentation and tests should describe the break explicitly so future contributors do not try to reintroduce the removed four-theme cycle by accident.
