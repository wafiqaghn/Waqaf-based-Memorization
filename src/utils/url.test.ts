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

  it('routes content through the local proxy during development', async () => {
    const { getProxiedServiceUrl, QuranFoundationService } = await loadUrlModule(false);
    try {
      expect(
        getProxiedServiceUrl(QuranFoundationService.CONTENT, '/api/qdc/resources/translations'),
      ).toBe('http://localhost:3000/api/proxy/content/api/qdc/resources/translations');
    } finally {
      clearEnv();
    }
  });
});
