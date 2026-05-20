import dotenv from 'dotenv';
import cron from 'node-cron';

// Load environment variables from .env before reading any values.
dotenv.config();

const rawPort = process.env.PORT ?? '3001';
const port = Number.parseInt(rawPort, 10);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: ${rawPort}`);
}

const newsApiKey = process.env.NEWS_API_KEY?.trim();
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const openAiApiKey = process.env.OPENAI_API_KEY?.trim() || undefined;
const defaultCronSchedule = '*/30 * * * *';
const rawCronSchedule = process.env.CRON_SCHEDULE?.trim() || defaultCronSchedule;
const cronSchedule = cron.validate(rawCronSchedule) ? rawCronSchedule : defaultCronSchedule;

if (rawCronSchedule !== cronSchedule) {
  console.warn(`[env] Invalid CRON_SCHEDULE value: ${rawCronSchedule}. Falling back to ${defaultCronSchedule}.`);
}
const apiSecretKey = process.env.API_SECRET_KEY?.trim();

if (!newsApiKey) {
  throw new Error('Missing required environment variable: NEWS_API_KEY');
}

if (!geminiApiKey) {
  throw new Error('Missing required environment variable: GEMINI_API_KEY');
}

if (!apiSecretKey) {
  throw new Error('Missing required environment variable: API_SECRET_KEY');
}

const maskValue = (value) => `${value.slice(0, 4)}***${value.slice(-4)}`;
const maskStatus = (value) => (value ? maskValue(value) : 'not set');

const env = {
  PORT: port,
  NEWS_API_KEY: newsApiKey,
  GEMINI_API_KEY: geminiApiKey,
  OPENAI_API_KEY: openAiApiKey,
  CRON_SCHEDULE: cronSchedule,
  API_SECRET_KEY: apiSecretKey
};

// Log loaded keys without exposing the full secret values.
console.log(
  '[env] loaded configuration:',
  `PORT=${env.PORT}`,
  `NEWS_API_KEY=${maskStatus(env.NEWS_API_KEY)}`,
  `GEMINI_API_KEY=${maskStatus(env.GEMINI_API_KEY)}`,
  `OPENAI_API_KEY=${maskStatus(env.OPENAI_API_KEY)}`,
  `CRON_SCHEDULE=${env.CRON_SCHEDULE}`,
  `API_SECRET_KEY=${maskStatus(env.API_SECRET_KEY)}`
);

export default env;