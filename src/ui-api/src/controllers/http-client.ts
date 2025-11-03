const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  // "Accept-Encoding": "gzip, deflate, br",
};

export class HttpClient {
  private readonly _baseUrl: string;

  constructor(baseUrl: string) {
    this._baseUrl = baseUrl;
  }

  async get(path: string, headers = {}) {
    const url = `${this._baseUrl}${path}`;
    const response = await fetch(`${this._baseUrl}${path}`, {
      method: "GET",
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `GET request to ${url} failed with status ${response.status}`
      );
    }

    return response.json();
  }

  async post(path: string, data: any, headers = {}) {
    const url = `${this._baseUrl}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        `POST request to ${url} failed with status ${response.status}`
      );
    }

    return response.json();
  }
}