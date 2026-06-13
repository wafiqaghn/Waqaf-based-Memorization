import { describe, expect, it, vi } from 'vitest';

const clearEnv = () => {
  delete process.env.API_GATEWAY_URL;
  delete process.env.SIGNATURE_TOKEN;
  delete process.env.INTERNAL_CLIENT_ID;
  delete process.env.PROXY_SIGNATURE_TOKEN;
};

describe('getAdditionalHeaders', () => {
  it('does not add proxy headers to fallback direct public API requests', async () => {
    vi.resetModules();
    clearEnv();

    const { getAdditionalHeaders } = await import('./headers');

    try {
      expect(
        getAdditionalHeaders({
          url: 'https://api.quran.com/api/qdc/pages/lookup',
          method: 'GET',
        } as never),
      ).toEqual({});
    } finally {
      clearEnv();
    }
  });

  it('adds proxy headers to non-direct server requests when proxy signing is configured', async () => {
    vi.resetModules();
    clearEnv();
    process.env.PROXY_SIGNATURE_TOKEN = 'proxy-token';

    const { getAdditionalHeaders, X_PROXY_SIGNATURE, X_PROXY_TIMESTAMP } = await import(
      './headers'
    );

    try {
      const headers = getAdditionalHeaders({
        url: '/api/proxy/content/api/qdc/pages/lookup',
        method: 'GET',
      } as never);

      expect(headers).toHaveProperty(X_PROXY_SIGNATURE);
      expect(headers).toHaveProperty(X_PROXY_TIMESTAMP);
    } finally {
      clearEnv();
    }
  });
});
