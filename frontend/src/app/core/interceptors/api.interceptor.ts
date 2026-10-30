import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    __env?: {
      API_URL?: string;
      BACKEND_URL?: string;
    };
  }
}

export function getBackendUrl(): string {
  if (typeof window !== 'undefined' && window.__env) {
    if (window.__env.BACKEND_URL) {
      return window.__env.BACKEND_URL.replace(/\/+$/, '');
    }
    if (window.__env.API_URL) {
      return window.__env.API_URL.replace(/\/+$/, '');
    }
  }
  return environment.apiUrl ? environment.apiUrl.replace(/\/+$/, '') : '';
}

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const backendUrl = getBackendUrl();

  // If a production backend URL is configured and request is an internal API path (/api/...)
  if (backendUrl && req.url.startsWith('/api')) {
    const apiReq = req.clone({
      url: `${backendUrl}${req.url}`
    });
    return next(apiReq);
  }

  return next(req);
};
