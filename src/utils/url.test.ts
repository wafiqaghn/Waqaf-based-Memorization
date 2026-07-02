import { describe, expect, it, vi } from 'vitest';

const loadUrlModule = async (isBuildTime: boolean) => {
  vi.resetModules();
  process.env.IS_BUILD_TIME = isBuildTime ? 'true' : 'false';
  process.env.NEXT_PUBLIC_VERCEL_ENV = 'development';
  process.env.NEXT_PUBLIC_VERCEL_URL = 'localhost:3000';
  process.env.API_GATEWAY_URL = 'https://api.quran.com';

  const { getProxiedServiceUrl, QuranFoundationService } = await import('./url');
  return { getProxiedServiceUrl, QuranFoundationService };
};

const clearEnv = () => {
  delete process.env.IS_BUILD_TIME;
  delete process.env.NEXT_PUBLIC_VERCEL_ENV;
  delete process.env.NEXT_PUBLIC_VERCEL_URL;
  delete process.env.API_GATEWAY_URL;
};

describe('getProxiedServiceUrl', () => {
  it('uses the content API root directly during static builds', async () => {
    const { getProxiedServiceUrl, QuranFoundationService } = await loadUrlModule(true);
    try {
      expect(
        getProxiedServiceUrl(QuranFoundationService.CONTENT, '/api/qdc/resources/translations'),
      ).toBe('https://api.quran.com/api/qdc/resources/translations');
    } finally {
      clearEnv();
    }
  });

  it('keeps auth on its service path during static builds', async () => {
    const { getProxiedServiceUrl, QuranFoundationService } = await loadUrlModule(true);
    try {
      expect(getProxiedServiceUrl(QuranFoundationService.AUTH, '/users/profile')).toBe(
        'https://api.quran.com/auth/users/profile',
      );
    } finally {
      clearEnv();
    }
  });

  it('routes content directly to the API on the server during runtime generation', async () => {
    const { getProxiedServiceUrl, QuranFoundationService } = await loadUrlModule(false);
    vi.stubGlobal('window', undefined);

    try {
      expect(
        getProxiedServiceUrl(QuranFoundationService.CONTENT, '/api/qdc/resources/translations'),
      ).toBe('https://api.quran.com/api/qdc/resources/translations');
    } finally {
      vi.unstubAllGlobals();
      clearEnv();
    }
  });

  it('falls back to the public API gateway on the server when API_GATEWAY_URL is missing', async () => {
    const { getProxiedServiceUrl, QuranFoundationService } = await loadUrlModule(false);
    delete process.env.API_GATEWAY_URL;
    vi.stubGlobal('window', undefined);

    try {
      expect(
        getProxiedServiceUrl(QuranFoundationService.CONTENT, '/api/qdc/pages/lookup'),
      ).toBe('https://api.quran.com/api/qdc/pages/lookup');
    } finally {
      vi.unstubAllGlobals();
      clearEnv();
    }
  });

  it('routes content through the current browser origin on the client', async () => {
    const { getProxiedServiceUrl, QuranFoundationService } = await loadUrlModule(false);
    vi.stubGlobal('window', {
      location: {
        origin: 'https://quran.example',
      },
    });

    try {
      expect(
        getProxiedServiceUrl(QuranFoundationService.CONTENT, '/api/qdc/resources/translations'),
      ).toBe('https://quran.example/api/proxy/content/api/qdc/resources/translations');
    } finally {
      vi.unstubAllGlobals();
      clearEnv();
    }
  });
});
