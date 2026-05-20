import env from '../config/env.js';

let warnedAboutOpenMode = false;

function readApiKey(request) {
  const headerKey = request.headers['x-api-key'];
  const queryKey = request.query?.apiKey;

  return String(headerKey ?? queryKey ?? '').trim();
}

export default function authMiddleware(request, response, next) {
  if (!env.API_SECRET_KEY) {
    if (!warnedAboutOpenMode) {
      console.warn('[auth] API_SECRET_KEY is not set. Authentication is disabled.');
      warnedAboutOpenMode = true;
    }

    return next();
  }

  const providedKey = readApiKey(request);

  if (!providedKey) {
    return response.status(401).json({
      success: false,
      error: 'API key required',
      hint: 'Add x-api-key header or ?apiKey= param'
    });
  }

  if (providedKey !== env.API_SECRET_KEY) {
    return response.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  return next();
}