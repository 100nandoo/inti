# Orchestration Labels

This repo uses a stable label scheme to encode dependency order, safe parallelism, and recommended Codex chat routing for implementation issues.

Each implementation issue gets exactly one orchestration label.

## Label format

Foundation stages use:

```text
f<N>-<C>
```

Parallel stages use:

```text
p<N><L>-<C>
```

Where:

- `N` is the dependency stage number
- `L` is the parallel lane letter within that stage
- `C` is the chat identifier

Examples:

- `f1-1`: foundation stage 1 in chat 1
- `f2-1`: foundation stage 2 in chat 1
- `p3a-1`: parallel stage 3, lane `a`, in chat 1
- `p3b-2`: parallel stage 3, lane `b`, in chat 2
- `f4-1`: convergence stage 4 in chat 1

## Planning rules

- Foundation stages are serial.
- Parallel stages may fan out once their blockers are complete.
- Exact blockers still belong in the issue body even when the label implies stage order.
- Orchestration labels are structural planning metadata and should remain stable unless the dependency graph was wrong.

## Packing mode

Default to `simple` packing for this repo unless a plan explicitly needs maximum concurrency.

- `simple` packing favors fewer chats and lower coordination overhead.
- `optimized` packing favors more chats and more parallelism.

## Current migration mapping

For the web Svelte TypeScript migration PRD:

- `f1-1`: add Svelte-aware web typecheck
- `f2-1`: type the shared web Svelte shell
- `p3a-1`: migrate the Text Workspace Svelte entry to TypeScript
- `p3b-2`: migrate the API key management page to TypeScript
- `p3c-3`: migrate the Runtime Settings page to TypeScript
- `p3d-2`: migrate the unauthorized page and helper typing shims
- `f4-1`: validate the migrated web Svelte surface
