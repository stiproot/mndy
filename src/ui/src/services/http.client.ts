import axios, { AxiosInstance } from 'axios';
import { AuthHttpClient } from './auth-http.client';
import { StorageService } from './storage.service';
import { ENV_VAR } from './env.service';
import { EnvKeys } from '@/types/env-keys';

const DEFAULT_BASE_URL = () => ENV_VAR(EnvKeys.VUE_APP_UI_API_BASE_URL);

let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

export class HttpClient {

  private readonly BASE_URL: string;
  private readonly _client: AxiosInstance;
  private readonly _refreshClient: AuthHttpClient;

  constructor(baseUrl: string | null = null) {
    this.BASE_URL = baseUrl || DEFAULT_BASE_URL();
    this._refreshClient = new AuthHttpClient();
    this._client = axios.create({ baseURL: this.BASE_URL });

    this._client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        if (error.response.status === 403 && !originalRequest._retry) {

          if (StorageService.isTokenRefreshing()) {
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject });
            }).then(() => {
              return axios(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          StorageService.isTokenRefreshing(true);

          try {
            await this._refreshClient.refreshTokens();
            processQueue(null);
            StorageService.isTokenRefreshing(false);
            return this._client(originalRequest);
          } catch (err) {
            processQueue(err);
            StorageService.isTokenRefreshing(false);
            return Promise.reject(err);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async request(method: 'get' | 'post' | 'patch', path: string, data?: any, headers = {}) {
    try {
      const response = await this._client.request({
        method,
        url: path,
        data,
        headers: { ...this.buildHeaders(), ...headers },
      });
      return response.data;
    } catch (error) {
      console.error(`Error in ${method}:`, error);
      throw error;
    }
  }

  public get(path: string, headers = {}) {
    return this.request('get', path, undefined, headers);
  }

  public post(path: string, data: any, headers = {}) {
    return this.request('post', path, data, headers);
  }

  public patch(path: string, data: any, headers = {}) {
    return this.request('patch', path, data, headers);
  }

  private buildHeaders() {
    let headers = { "Content-Type": "application/json" };
    const token = StorageService.accessToken()?.raw;

    if (token) headers = Object.assign(headers, { "Authorization": `Bearer ${token}` });

    return headers;
  }
}

