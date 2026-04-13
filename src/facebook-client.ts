export class FacebookClient {
  private baseUrl = 'https://graph.facebook.com/v21.0';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      const msg = (error as { error?: { message?: string } }).error?.message ?? JSON.stringify(error);
      throw new Error(`Facebook API error (${response.status}): ${msg}`);
    }

    return response.json() as Promise<T>;
  }

  async post<T>(path: string, data: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== '') {
        body.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      const msg = (error as { error?: { message?: string } }).error?.message ?? JSON.stringify(error);
      throw new Error(`Facebook API error (${response.status}): ${msg}`);
    }

    return response.json() as Promise<T>;
  }
}
