import cron from 'node-cron';
import env from '../config/env.js';
import { collectAllNews } from './newsAggregator.js';
import { processArticles } from '../processors/index.js';
import { loadDigestStore, saveDigestStore } from './digestPersistence.js';

const digestStore = loadDigestStore();
let scheduledJob = null;
let digestRunInProgress = false;

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function pruneDigestStore() {
  const keys = [...digestStore.keys()].sort();

  while (keys.length > 7) {
    const oldestKey = keys.shift();

    if (oldestKey) {
      digestStore.delete(oldestKey);
    }
  }
}

async function runDigest() {
  if (digestRunInProgress) {
    console.log('[newsScheduler] Digest run already in progress, skipping');
    return null;
  }

  digestRunInProgress = true;

  try {
    console.log('Starting news collection...');

    const articles = await collectAllNews();
    const clusters = await processArticles(articles);
    const todayKey = getTodayKey();
    const articleCount = Array.isArray(articles) ? articles.length : 0;

    digestStore.set(todayKey, {
      clusters,
      lastUpdated: new Date().toISOString(),
      articleCount
    });

    pruneDigestStore();

    await saveDigestStore(digestStore);

    console.log(`Digest ready: ${Array.isArray(clusters) ? clusters.length : 0} clusters, ${articleCount} articles`);

    return digestStore.get(todayKey) ?? null;
  } catch (error) {
    console.error('[newsScheduler] Failed to run digest', {
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack
    });

    return null;
  } finally {
    digestRunInProgress = false;
  }
}

/**
 * Start the digest scheduler and run once immediately on startup.
 *
 * @returns {Promise<import('node-cron').ScheduledTask | null>}
 */
export async function startScheduler() {
  if (!scheduledJob) {
    scheduledJob = cron.schedule(env.CRON_SCHEDULE, () => {
      void runDigest();
    });
  }

  await runDigest();

  return scheduledJob;
}

/**
 * Get the most recent digest entry from the in-memory store.
 *
 * @returns {{clusters: Array<object>, lastUpdated: string, articleCount: number} | null}
 */
export function getLatestDigest() {
  if (!digestStore.size) {
    return null;
  }

  const latestEntry = [...digestStore.entries()].sort((left, right) => left[0].localeCompare(right[0])).at(-1);

  return latestEntry ? latestEntry[1] : null;
}

/**
 * Get the full digest store map.
 *
 * @returns {Map<string, {clusters: Array<object>, lastUpdated: string, articleCount: number}>}
 */
export function getDigestStore() {
  return digestStore;
}

export function stopScheduler() {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
  }
}

export { runDigest };