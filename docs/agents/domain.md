# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- `CONTEXT.md` at the repo root
- `docs/adr/` if it exists, limited to ADRs relevant to the area being changed

If these files don't exist, proceed silently.

## File structure

This is a single-context repo.

```text
/
|- CONTEXT.md
|- docs/adr/
+- ...
```

## Use the glossary's vocabulary

When naming domain concepts in issues, plans, tests, or refactors, use the terms defined in `CONTEXT.md`. Avoid drifting to synonyms if the glossary already defines the preferred term.

## Flag ADR conflicts

If a proposed change conflicts with an existing ADR, surface that conflict explicitly instead of silently overriding it.
