import { EventEmitter } from 'events';

import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextApiRequest, NextApiResponse } from 'next';

import generateSignature from '@/utils/auth/signature';
import {
  X_AUTH_SIGNATURE,
  X_INTERNAL_CLIENT,
  X_TIMESTAMP,
  X_PROXY_SIGNATURE,
  X_PROXY_TIMESTAMP,
} from '@/utils/headers';

const ERROR_MESSAGES = {
  PROXY_ERROR: 'Proxy error',
  PROXY_HANDLER_ERROR: 'Proxy handler error',
  FORBIDDEN: 'Forbidden',
  PAYLOAD_TOO_LARGE: 'Payload too large',
};

const ALLOWED_DOMAINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((domain) => domain.trim());

// This line increases the default maximum number of event listeners for the EventEmitter to a better number like 20.
// It is necessary to prevent memory leak warnings when multiple listeners are added,
// which can occur in a proxy setup like this where multiple requests are handled concurrently.
EventEmitter.defaultMaxListeners = Number(process.env.PROXY_DEFAULT_MAX_LISTENERS) || 100;

const IS_DEVELOPMENT = process.env.NEXT_PUBLIC_VERCEL_ENV === 'development';
const DEFAULT_BODY_SIZE_LIMIT = '8mb';

const getHostname = (host: string | undefined): string | undefined => host?.split(':')[0];

const isOriginAllowed = (origin: string | undefined, requestHost: string | undefined): boolean => {
  if (!origin) return false;
  const url = new URL(origin);
  const { hostname } = url;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (hostname === getHostname(requestHost)) return true;
  return ALLOWED_DOMAINS.includes(hostname);
};

const parseSizeLimitToBytes = (value: string): number => {
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return parseSizeLimitToBytes(DEFAULT_BODY_SIZE_LIMIT);

  const size = Number(match[1]);
  const unit = match[2] || 'b';
  const multipliers = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  return Math.floor(size * multipliers[unit]);
};

const isRequestBodyTooLarge = (req: NextApiRequest): boolean => {
  const contentLength = req.headers['content-length'];
  const sizeLimit = process.env.API_BODY_SIZE_LIMIT || DEFAULT_BODY_SIZE_LIMIT;

  if (!contentLength) return false;
  return Number(contentLength) > parseSizeLimitToBytes(sizeLimit);
};

// Headers that must be stripped before forwarding to upstream API.
// Cloudflare WAF on api.quran.com rejects requests containing these
// because they reveal the request originated from a local/proxy environment.
const HEADERS_TO_STRIP = [
  // Proxy forwarding headers (expose localhost:3000 as origin)
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
  'x-forwarded-for',
  // Browser CORS metadata (conflict with changeOrigin spoofed Host)
  'origin',
  'referer',
  // Browser Sec-Fetch metadata
  'sec-fetch-site',
  'sec-fetch-mode',
  'sec-fetch-dest',
  'sec-fetch-user',
  // Internal proxy signature headers (not recognized by public API)
  X_PROXY_SIGNATURE,
  X_PROXY_TIMESTAMP,
  // Cookies from localhost (can trigger WAF bot detection)
  'cookie',
];

const handleProxyReq = (proxyReq, req, res) => {
  if (IS_DEVELOPMENT) {
    // In development, only block explicitly disallowed external origins.
    // Skip signature verification since local tokens don't match production.
    const origin = req.headers.origin || req.headers.referer || '';
    if (origin && !isOriginAllowed(origin, req.headers.host)) {
      res.status(403).send({ error: ERROR_MESSAGES.FORBIDDEN });
      return;
    }
  } else {
    // Production: full origin + signature verification
    const origin = req.headers.origin || req.headers.referer || '';
    if (origin) {
      if (!isOriginAllowed(origin, req.headers.host)) {
        res.status(403).send({ error: ERROR_MESSAGES.FORBIDDEN });
        return;
      }
    } else if (!verifySignature(req, res)) {
      return;
    }
    attachCookies(proxyReq, req);
    attachSignatureHeaders(proxyReq, req);
  }

  // Strip all headers that cause Cloudflare WAF to return 403
  HEADERS_TO_STRIP.forEach((header) => {
    proxyReq.removeHeader(header);
  });
};

const verifySignature = (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const requestUrl = `${protocol}://${req.headers.host}/api/proxy${req.url}`;
  const timestampHeader = req.headers[X_PROXY_TIMESTAMP] as string;
  const { signature } = generateSignature(
    req,
    requestUrl,
    process.env.PROXY_SIGNATURE_TOKEN as string,
    timestampHeader,
  );

  if (req.headers[X_PROXY_SIGNATURE] !== signature) {
    res.status(403).send({ error: ERROR_MESSAGES.FORBIDDEN });
    return false;
  }
  return true;
};

const attachCookies = (proxyReq, req) => {
  if (req.headers.cookie) {
    proxyReq.setHeader('Cookie', req.headers.cookie);
  }
};

const attachSignatureHeaders = (proxyReq, req) => {
  const requestUrl = `${process.env.API_GATEWAY_URL}${req.url}`;
  const { signature, timestamp } = generateSignature(
    req,
    requestUrl,
    process.env.SIGNATURE_TOKEN as string,
  );

  proxyReq.setHeader(X_AUTH_SIGNATURE, signature);
  proxyReq.setHeader(X_TIMESTAMP, timestamp);
  proxyReq.setHeader(X_INTERNAL_CLIENT, process.env.INTERNAL_CLIENT_ID);
};

const apiProxy = createProxyMiddleware<NextApiRequest, NextApiResponse>({
  target: process.env.API_GATEWAY_URL,
  changeOrigin: true,
  pathRewrite: (path) => path.replace(/^\/api\/proxy\/[^/]+/, ''),
  secure: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production', // Disable SSL verification to avoid UNABLE_TO_VERIFY_LEAF_SIGNATURE error for dev
  logger: console,

  on: {
    proxyReq: handleProxyReq,

    proxyRes: (proxyRes, req, res) => {
      // Set cookies from the proxy response to the original response
      const proxyCookies = proxyRes.headers['set-cookie'];
      if (proxyCookies) {
        res.setHeader('Set-Cookie', proxyCookies);
      }

      // Prevent intermediate proxy caching (Traefik, nginx, etc.)
      // This ensures fresh data flows through from the API Gateway's CF cache
      // Note: This does NOT affect CF caching at the API Gateway level
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    },

    error: (err, req, res) => {
      // BUGFIX: The original code was calling res.end() with a function that returns an object:
      // res.end(() => ({ error: ERROR_MESSAGES.PROXY_ERROR, message: err.message }))
      //
      // This caused a TypeError because res.end() expects a string, Buffer, or ArrayBuffer,
      // not a function. The function was being passed as the response body, which caused:
      // "The 'string' argument must be of type string... Received type function"
      //
      // The fix is to properly send JSON responses based on the response object type:

      // Check if res is a NextApiResponse (has status method) or a Socket
      if ('status' in res && typeof res.status === 'function') {
        res.status(500).json({ error: ERROR_MESSAGES.PROXY_ERROR, message: err.message });
      } else {
        // For Socket or other types, just end the response with a stringified error
        res.end(JSON.stringify({ error: ERROR_MESSAGES.PROXY_ERROR, message: err.message }));
      }
    },
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (isRequestBodyTooLarge(req)) {
    res.status(413).json({ error: ERROR_MESSAGES.PAYLOAD_TOO_LARGE });
    return;
  }

  apiProxy(req, res, (err) => {
    if (err) {
      res.status(500).json({ error: ERROR_MESSAGES.PROXY_HANDLER_ERROR, message: err.message });
    }
  });
}
