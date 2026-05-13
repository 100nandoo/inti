async function readJSON(response) {
  if (response.ok) {
    return response.json();
  }

  const body = await response.json().catch(() => ({ error: response.statusText }));
  throw new Error(body.error || response.statusText);
}

export async function listAPIKeys({ fetchImpl = fetch, apiURL }) {
  const response = await fetchImpl(apiURL('/api/admin/keys'));
  const body = await readJSON(response);
  return body.keys || [];
}

export async function createAPIKey({ fetchImpl = fetch, apiURL, name }) {
  const response = await fetchImpl(apiURL('/api/admin/keys'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  return readJSON(response);
}

export async function deleteAPIKey({ fetchImpl = fetch, apiURL, id }) {
  const response = await fetchImpl(apiURL(`/api/admin/keys/${id}`), {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || response.statusText);
  }
}
