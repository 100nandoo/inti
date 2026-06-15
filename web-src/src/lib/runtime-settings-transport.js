// @ts-check

/**
 * @template T
 * @param {Response} response
 * @param {string} fallbackMessage
 * @returns {Promise<T>}
 */
export async function readConfigJSON(response, fallbackMessage) {
  if (response.ok) {
    return /** @type {Promise<T>} */ (response.json());
  }

  const body = await response.json().catch(() => /** @type {{ error?: string }} */ ({}));
  throw new Error(body.error || response.statusText || fallbackMessage);
}

/**
 * @template T
 * @param {{
 *   apiURL: (path: string) => string;
 *   path: string;
 *   fetchImpl?: typeof fetch;
 *   errorMessage: string;
 * }} input
 * @returns {Promise<T>}
 */
export async function loadRuntimeConfig({
  apiURL,
  path,
  fetchImpl = fetch,
  errorMessage,
}) {
  const response = await fetchImpl(apiURL(path));
  return readConfigJSON(response, errorMessage);
}

/**
 * @template T
 * @param {{
 *   apiURL: (path: string) => string;
 *   path: string;
 *   payload: unknown;
 *   fetchImpl?: typeof fetch;
 *   errorMessage: string;
 * }} input
 * @returns {Promise<T>}
 */
export async function saveRuntimeConfig({
  apiURL,
  path,
  payload,
  fetchImpl = fetch,
  errorMessage,
}) {
  const response = await fetchImpl(apiURL(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return readConfigJSON(response, errorMessage);
}
