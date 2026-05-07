window.IntiSummarizerModels = (() => {
  const cache = new Map();

  async function get(provider) {
    if (!provider) return [];
    if (provider === 'openrouter') return [];
    if (cache.has(provider)) return cache.get(provider);

    const request = fetch(`/summarizer-models/${provider}.json`).then(async (response) => {
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

  async function populateSelect(selectElement, containerElement, provider, selectedModel = '') {
    const requestKey = `${provider || '__none__'}:${selectedModel}`;
    selectElement.dataset.requestKey = requestKey;

    let models = [];
    try {
      models = await get(provider);
    } catch (error) {
      if (selectElement.dataset.requestKey !== requestKey) return;
      console.error(error);
    }

    if (selectElement.dataset.requestKey !== requestKey) return;

    if (containerElement) {
      containerElement.hidden = models.length === 0;
    }

    selectElement.innerHTML = '';
    models.forEach(({ value, label }) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === selectedModel) option.selected = true;
      selectElement.appendChild(option);
    });

    if (models.length > 0 && ![...selectElement.options].some((option) => option.value === selectedModel)) {
      selectElement.selectedIndex = 0;
    }
  }

  return { get, populateSelect };
})();
