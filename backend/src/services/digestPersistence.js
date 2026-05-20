import fs from 'fs';
import path from 'path';

const DEFAULT_STORE_PATH = path.resolve(process.cwd(), 'data', 'digests.json');

function getStorePath() {
  const overridePath = process.env.DIGEST_STORE_PATH?.trim();

  return overridePath ? path.resolve(overridePath) : DEFAULT_STORE_PATH;
}

function normalizeDigestEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const clusters = Array.isArray(entry.clusters) ? entry.clusters : [];
  const lastUpdated = typeof entry.lastUpdated === 'string' ? entry.lastUpdated : new Date().toISOString();
  const articleCount = Number.isFinite(entry.articleCount) ? entry.articleCount : 0;

  return {
    clusters,
    lastUpdated,
    articleCount
  };
}

export function loadDigestStore() {
  const storePath = getStorePath();

  try {
    if (!fs.existsSync(storePath)) {
      return new Map();
    }

    const rawText = fs.readFileSync(storePath, 'utf8');

    if (!rawText.trim()) {
      return new Map();
    }

    const parsed = JSON.parse(rawText);
    const entries = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.entries)
        ? parsed.entries
        : Object.entries(parsed ?? {});

    return new Map(
      entries
        .map(([key, value]) => {
          const normalizedValue = normalizeDigestEntry(value);

          if (!key || !normalizedValue) {
            return null;
          }

          return [String(key), normalizedValue];
        })
        .filter(Boolean)
    );
  } catch (error) {
    console.warn('[digestPersistence] Failed to load digest store, starting empty', {
      storePath,
      errorName: error?.name,
      errorMessage: error?.message
    });

    return new Map();
  }
}

export async function saveDigestStore(store) {
  const storePath = getStorePath();
  const directory = path.dirname(storePath);
  const serializableEntries = [...(store instanceof Map ? store.entries() : [])].map(([key, value]) => [key, normalizeDigestEntry(value)]);

  try {
    await fs.promises.mkdir(directory, { recursive: true });
    await fs.promises.writeFile(storePath, `${JSON.stringify({ entries: serializableEntries }, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.error('[digestPersistence] Failed to save digest store', {
      storePath,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack
    });
  }
}
