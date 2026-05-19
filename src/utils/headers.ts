import { NextApiRequest } from 'next';

import generateSignature from './auth/signature';
import { isStaticBuild } from './build';

export const X_AUTH_SIGNATURE = 'x-auth-signature';
export const X_TIMESTAMP = 'x-timestamp';
export const X_PROXY_SIGNATURE = 'x-proxy-signature';
export const X_PROXY_TIMESTAMP = 'x-proxy-timestamp';
export const X_INTERNAL_CLIENT = 'x-internal-client';

export const getAdditionalHeaders = (req: NextApiRequest) => {
  let additionalHeaders = {};
  const isServer = typeof window === 'undefined';
  const isDirectApiRequest =
    isServer &&
    Boolean(process.env.API_GATEWAY_URL) &&
    req.url?.startsWith(process.env.API_GATEWAY_URL);

  if (isStaticBuild || isDirectApiRequest) {
    const { signature, timestamp } = generateSignature(
      req,
      req.url,
      process.env.SIGNATURE_TOKEN as string,
    );
    additionalHeaders = {
      [X_AUTH_SIGNATURE]: signature,
      [X_TIMESTAMP]: timestamp,
      [X_INTERNAL_CLIENT]: process.env.INTERNAL_CLIENT_ID,
    };
  }

  if (isServer && !isDirectApiRequest) {
    const { signature: proxySignature, timestamp: proxyTimestamp } = generateSignature(
      req,
      req.url,
      process.env.PROXY_SIGNATURE_TOKEN as string,
    );
    additionalHeaders = {
      ...additionalHeaders,
      [X_PROXY_SIGNATURE]: proxySignature,
      [X_PROXY_TIMESTAMP]: proxyTimestamp,
    };
  }

  return additionalHeaders;
};
