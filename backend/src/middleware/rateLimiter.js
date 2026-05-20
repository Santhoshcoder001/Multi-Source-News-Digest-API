import rateLimit from 'express-rate-limit';

function buildLimiter(windowMs, max) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (request, response) => {
      const retryAfterSeconds = Math.ceil((request.rateLimit?.resetTime?.getTime() - Date.now()) / 1000) || 60;

      return response.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: retryAfterSeconds
      });
    }
  });
}

export const generalLimiter = buildLimiter(15 * 60 * 1000, 100);
export const strictLimiter = buildLimiter(60 * 1000, 20);