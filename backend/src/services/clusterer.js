import { v4 as uuidv4 } from 'uuid';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'is', 'are', 'was', 'were',
  'of', 'to', 'for', 'and', 'or', 'but', 'it', 'its', 'with', 'that',
  'this', 'as', 'by', 'from', 'has', 'have'
]);

const TFIDF_SIMILARITY_THRESHOLD = 0.2;
const TITLE_KEYWORD_LIMIT = 5;

function normalizeText(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenize(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && token.length > 1 && !STOP_WORDS.has(token));
}

function extractTopKeywordsFromTitle(title, limit = TITLE_KEYWORD_LIMIT) {
  const tokens = tokenize(title);

  if (!tokens.length) {
    return [];
  }

  const counts = new Map();
  const firstSeen = new Map();

  tokens.forEach((token, index) => {
    counts.set(token, (counts.get(token) ?? 0) + 1);

    if (!firstSeen.has(token)) {
      firstSeen.set(token, index);
    }
  });

  return [...counts.entries()]
    .sort((left, right) => {
      const [leftToken, leftCount] = left;
      const [rightToken, rightCount] = right;

      if (rightCount !== leftCount) {
        return rightCount - leftCount;
      }

      const leftPosition = firstSeen.get(leftToken) ?? 0;
      const rightPosition = firstSeen.get(rightToken) ?? 0;

      if (leftPosition !== rightPosition) {
        return leftPosition - rightPosition;
      }

      return leftToken.localeCompare(rightToken);
    })
    .slice(0, limit)
    .map(([token]) => token);
}

function buildDocumentTokens(article) {
  return [article?.title, article?.description, article?.content]
    .map((part) => tokenize(part))
    .flat();
}

function buildTfIdfVector(tokens, documentFrequency, documentCount) {
  if (!tokens.length) {
    return new Map();
  }

  const termCounts = new Map();
  tokens.forEach((token) => {
    termCounts.set(token, (termCounts.get(token) ?? 0) + 1);
  });

  const vector = new Map();
  const totalTerms = tokens.length;

  for (const [term, count] of termCounts.entries()) {
    const tf = count / totalTerms;
    const df = documentFrequency.get(term) ?? 0;
    const idf = Math.log((documentCount + 1) / (df + 1)) + 1;
    vector.set(term, tf * idf);
  }

  return vector;
}

function cosineSimilarity(leftVector, rightVector) {
  if (!leftVector.size || !rightVector.size) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (const value of leftVector.values()) {
    leftMagnitude += value * value;
  }

  for (const value of rightVector.values()) {
    rightMagnitude += value * value;
  }

  const smallerVector = leftVector.size <= rightVector.size ? leftVector : rightVector;
  const largerVector = smallerVector === leftVector ? rightVector : leftVector;

  for (const [term, value] of smallerVector.entries()) {
    const otherValue = largerVector.get(term);

    if (otherValue) {
      dotProduct += value * otherValue;
    }
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function buildUnionFind(size) {
  const parent = Array.from({ length: size }, (_, index) => index);
  const rank = Array.from({ length: size }, () => 0);

  function find(index) {
    if (parent[index] !== index) {
      parent[index] = find(parent[index]);
    }

    return parent[index];
  }

  function union(leftIndex, rightIndex) {
    const leftRoot = find(leftIndex);
    const rightRoot = find(rightIndex);

    if (leftRoot === rightRoot) {
      return;
    }

    if (rank[leftRoot] < rank[rightRoot]) {
      parent[leftRoot] = rightRoot;
      return;
    }

    if (rank[leftRoot] > rank[rightRoot]) {
      parent[rightRoot] = leftRoot;
      return;
    }

    parent[rightRoot] = leftRoot;
    rank[leftRoot] += 1;
  }

  return { find, union };
}

function countSharedKeywords(leftKeywords, rightKeywords) {
  const leftSet = new Set(leftKeywords);
  let sharedCount = 0;

  for (const keyword of rightKeywords) {
    if (leftSet.has(keyword)) {
      sharedCount += 1;
    }
  }

  return sharedCount;
}

function inferTopicName(keywords) {
  if (!keywords.length) {
    return 'general';
  }

  if (keywords.length === 1) {
    return keywords[0];
  }

  return `${keywords[0]} ${keywords[1]}`;
}

function sortKeywordsByFrequency(keywordCounts) {
  return [...keywordCounts.entries()]
    .sort((left, right) => {
      const [leftToken, leftCount] = left;
      const [rightToken, rightCount] = right;

      if (rightCount !== leftCount) {
        return rightCount - leftCount;
      }

      return leftToken.localeCompare(rightToken);
    })
    .map(([token]) => token);
}

/**
 * Cluster articles using keyword overlap and a manual TF-IDF similarity score.
 *
 * @param {Array<{title?: string, description?: string, content?: string}>} articles - Articles to cluster.
 * @returns {Promise<Array<{clusterId: string, topic: string, articles: Array<object>, keywords: string[]}>>}
 */
export async function clusterArticles(articles) {
  if (!Array.isArray(articles) || articles.length === 0) {
    return [];
  }

  const normalizedArticles = articles.filter((article) => article && typeof article === 'object');

  if (!normalizedArticles.length) {
    return [];
  }

  const titleKeywords = normalizedArticles.map((article) => extractTopKeywordsFromTitle(article?.title));
  const documentTokens = normalizedArticles.map((article) => buildDocumentTokens(article));

  const documentFrequency = new Map();

  documentTokens.forEach((tokens) => {
    const uniqueTokens = new Set(tokens);

    for (const token of uniqueTokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  });

  const documentCount = normalizedArticles.length;
  const vectors = documentTokens.map((tokens) => buildTfIdfVector(tokens, documentFrequency, documentCount));
  const unionFind = buildUnionFind(documentCount);

  for (let leftIndex = 0; leftIndex < documentCount; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < documentCount; rightIndex += 1) {
      const sharedKeywordCount = countSharedKeywords(titleKeywords[leftIndex], titleKeywords[rightIndex]);

      if (sharedKeywordCount >= 2) {
        unionFind.union(leftIndex, rightIndex);
        continue;
      }

      const similarity = cosineSimilarity(vectors[leftIndex], vectors[rightIndex]);

      if (similarity >= TFIDF_SIMILARITY_THRESHOLD) {
        unionFind.union(leftIndex, rightIndex);
      }
    }
  }

  const groupedIndexes = new Map();

  for (let index = 0; index < documentCount; index += 1) {
    const root = unionFind.find(index);

    if (!groupedIndexes.has(root)) {
      groupedIndexes.set(root, []);
    }

    groupedIndexes.get(root).push(index);
  }

  const clusters = [];
  const generalArticles = [];
  const generalKeywordCounts = new Map();

  for (const indexes of groupedIndexes.values()) {
    if (indexes.length < 2) {
      for (const index of indexes) {
        const article = normalizedArticles[index];
        generalArticles.push(article);

        for (const keyword of titleKeywords[index]) {
          generalKeywordCounts.set(keyword, (generalKeywordCounts.get(keyword) ?? 0) + 1);
        }
      }

      continue;
    }

    const clusterKeywordCounts = new Map();
    const clusterArticles = indexes.map((index) => normalizedArticles[index]);

    for (const index of indexes) {
      for (const keyword of titleKeywords[index]) {
        clusterKeywordCounts.set(keyword, (clusterKeywordCounts.get(keyword) ?? 0) + 1);
      }
    }

    const clusterKeywords = sortKeywordsByFrequency(clusterKeywordCounts).slice(0, TITLE_KEYWORD_LIMIT);

    clusters.push({
      clusterId: uuidv4(),
      topic: inferTopicName(clusterKeywords),
      articles: clusterArticles,
      keywords: clusterKeywords
    });
  }

  if (generalArticles.length) {
    const generalKeywords = sortKeywordsByFrequency(generalKeywordCounts).slice(0, TITLE_KEYWORD_LIMIT);

    clusters.push({
      clusterId: uuidv4(),
      topic: 'general',
      articles: generalArticles,
      keywords: generalKeywords
    });
  }

  return clusters.sort((left, right) => right.articles.length - left.articles.length);
}