<script lang="ts">
  import type { SummaryData } from "../../shared/types.js";
  import { marked } from "marked";

  let { summary }: { summary: SummaryData } = $props();

  let copied = $state(false);
  let copyTimeout: ReturnType<typeof setTimeout> | null = null;

  const formattedDate = $derived(
    new Date(summary.timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  const renderedSummary = $derived(
    marked.parse(summary.summary, { async: false, breaks: true }) as string,
  );

  async function copyToClipboard() {
    await navigator.clipboard.writeText(summary.summary);
    copied = true;
    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      copied = false;
      copyTimeout = null;
    }, 2000);
  }
</script>

<div class="summary">
  <h2 class="title">{summary.articleTitle}</h2>
  <p class="meta">
    Summarized {formattedDate}
    {#if summary.provider || summary.model}
      • {summary.provider ?? ""} • {summary.model ?? ""}
    {/if}
  </p>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <div class="md-body">{@html renderedSummary}</div>
  <button class="copy-btn" onclick={copyToClipboard}>
    {copied ? "✓ Copied!" : "Copy to clipboard"}
  </button>
</div>

<style>
  .summary {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .title {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
    color: var(--text);
    line-height: 1.4;
  }

  .meta {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0;
  }

  /* Markdown body reset + theme-aware styles */
  .md-body {
    font-size: 0.875rem;
    line-height: 1.65;
    color: var(--summary-text, var(--text-secondary));
    margin: 0.25rem 0 0;
  }

  .md-body :global(p) {
    margin: 0 0 0.6em;
  }

  .md-body :global(p:last-child) {
    margin-bottom: 0;
  }

  .md-body :global(h1),
  .md-body :global(h2),
  .md-body :global(h3),
  .md-body :global(h4) {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0.75em 0 0.3em;
    color: var(--text);
    line-height: 1.3;
  }

  .md-body :global(ul),
  .md-body :global(ol) {
    margin: 0.3em 0 0.6em;
    padding-left: 1.4em;
  }

  .md-body :global(li) {
    margin-bottom: 0.2em;
  }

  .md-body :global(strong) {
    font-weight: 600;
    color: var(--text);
  }

  .md-body :global(em) {
    font-style: italic;
  }

  .md-body :global(code) {
    font-family: ui-monospace, monospace;
    font-size: 0.8em;
    background: var(--bg-hover);
    border: 1px solid var(--border-input);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    color: var(--accent);
  }

  .md-body :global(pre) {
    background: var(--bg-hover);
    border: 1px solid var(--border-input);
    border-radius: 5px;
    padding: 0.6em 0.75em;
    overflow-x: auto;
    margin: 0.5em 0;
  }

  .md-body :global(pre code) {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.8em;
    color: var(--text-secondary);
  }

  .md-body :global(blockquote) {
    border-left: 3px solid var(--accent);
    margin: 0.5em 0;
    padding: 0.3em 0.75em;
    color: var(--text-muted);
    font-style: italic;
  }

  .md-body :global(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 0.75em 0;
  }

  .md-body :global(a) {
    color: var(--accent);
    text-decoration: none;
  }

  .md-body :global(a:hover) {
    text-decoration: underline;
  }

  .copy-btn {
    align-self: flex-start;
    margin-top: 0.5rem;
    padding: 0.35rem 0.8rem;
    border: 1px solid var(--copy-btn-border, #d1d5db);
    border-radius: 6px;
    background: var(--copy-btn-bg, #f9fafb);
    color: var(--text-secondary);
    font-size: 0.8rem;
    cursor: pointer;
    transition:
      background 0.15s,
      border-color 0.15s;
  }

  .copy-btn:hover {
    background: var(--copy-btn-hover, #f3f4f6);
  }
</style>
