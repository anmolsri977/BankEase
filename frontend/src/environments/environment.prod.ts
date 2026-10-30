declare global {
  interface Window {
    __env?: {
      API_URL?: string;
      BACKEND_URL?: string;
    };
  }
}

export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window.__env?.BACKEND_URL || window.__env?.API_URL)) || ''
};
