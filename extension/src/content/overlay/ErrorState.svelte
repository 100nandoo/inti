<script lang="ts">
  let { message = 'Something went wrong. Please try again.' }: { message?: string } = $props();
</script>

<div class="error">
  <span class="icon" aria-hidden="true">⚠️</span>
  <p>{message}</p>
</div>

<style>
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 0;
    text-align: center;
  }

  .icon {
    font-size: 1.5rem;
  }

  p {
    margin: 0;
    color: #ef4444;
    font-size: 0.875rem;
    line-height: 1.5;
  }
</style>
