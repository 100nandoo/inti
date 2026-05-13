const cache = new Map();

export async function getSummarizerModels(provider, fetchImpl = fetch) {
  if (!provider || provider === 'openrouter') return [];
  if (cache.has(provider)) return cache.get(provider);

  const request = fetchImpl(`/summarizer-models/${provider}.json`).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Could not load models for ${provider}`);
    }
    return response.json();
  });

  cache.set(provider, request);

  try {
    return await request;
  } catch (error) {
    cache.delete(provider);
    throw error;
  }
}
