const BASE_URL = 'http://localhost:3001/ui-api';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Perform an HTTP POST request.
 * @param {string} url - The API endpoint.
 * @param {object} data - The data to send in the request body.
 * @param {object} headers - Custom headers (optional).
 * @returns {Promise} - A Promise that resolves with the response data or rejects with an error.
 */
async function post(url, data, headers = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`POST request to ${url} failed with status ${response.status}`);
  }
  return response.json();
}

// module.export = { post };
export { post };
