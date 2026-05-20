import { useEffect, useMemo, useState } from 'react';
import ClusterCard from './components/ClusterCard';
import ErrorBanner from './components/ErrorBanner';
import LoadingSpinner from './components/LoadingSpinner';
import { fetchDigest, fetchTopic, fetchTopics } from './services/api';
import './App.css';

type Cluster = {
  clusterId: string;
  topic: string;
  keywords: string[];
  articles: Array<{
    title?: string;
    url?: string;
    source?: string;
    publishedAt?: string;
    summary?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
  }>;
};

type DigestResponse = {
  lastUpdated: string;
  clusters: Cluster[];
  clusterCount: number;
  articleCount: number;
};

const sentimentOptions = ['All', 'positive', 'neutral', 'negative'] as const;

function App() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [topicClusters, setTopicClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<(typeof sentimentOptions)[number]>('All');
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [topicQuery, setTopicQuery] = useState('');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  const loadDigest = async () => {
    setLoading(true);
    setError('');
    setActiveTopic(null);
    setTopicQuery('');

    try {
      const response = (await fetchDigest({
        sentiment: selectedSentiment === 'All' ? undefined : selectedSentiment
      })) as DigestResponse;

      setClusters(response.clusters ?? []);
      setTopicClusters([]);
      setLastUpdated(response.lastUpdated ?? '');
      setExpandedCluster((current) => current ?? response.clusters?.[0]?.clusterId ?? null);
      const topicsResponse = (await fetchTopics()) as { topics?: string[] };
      setAvailableTopics(topicsResponse.topics ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load digest');
    } finally {
      setLoading(false);
    }
  };

  const loadTopic = async (topicName: string) => {
    setLoading(true);
    setError('');
    setActiveTopic(topicName);
    setTopicQuery(topicName);

    try {
      const response = (await fetchTopic(topicName)) as { clusters?: Cluster[]; topic?: string };
      setTopicClusters(response.clusters ?? []);
      setExpandedCluster(response.clusters?.[0]?.clusterId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDigest();
  }, [selectedSentiment]);

  const submitTopicSearch = async () => {
    const nextTopic = topicQuery.trim();

    if (!nextTopic) {
      await loadDigest();
      return;
    }

    await loadTopic(nextTopic);
  };

  const visibleClusters = useMemo(() => {
    if (!activeTopic) {
      return clusters;
    }

    return topicClusters;
  }, [activeTopic, clusters, topicClusters]);

  const renderedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Waiting for first digest';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Multi-source briefing</p>
          <h1>📰 News Digest</h1>
        </div>

        <div className="toolbar">
          <label>
            Sentiment
            <select value={selectedSentiment} onChange={(event) => setSelectedSentiment(event.target.value as typeof selectedSentiment)}>
              {sentimentOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={() => void loadDigest()}>
            Refresh
          </button>
        </div>
      </header>

      <section className="status-row">
        <p>Last updated: {renderedLastUpdated}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitTopicSearch();
          }}
        >
          <label>
            Topic filter
            <input
              type="text"
              placeholder="Try technology, business, science..."
              value={topicQuery}
              onChange={(event) => setTopicQuery(event.target.value)}
            />
          </label>
          <button type="submit">Search</button>
        </form>
      </section>

      <section className="topic-pills">
        <button type="button" onClick={() => void loadDigest()}>
          All topics
        </button>
        {availableTopics.map((topic) => (
          <button key={topic} type="button" onClick={() => void loadTopic(topic)}>
            {topic}
          </button>
        ))}
      </section>

      {error ? <ErrorBanner message={error} onRetry={() => void loadDigest()} /> : null}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <main className="cluster-grid">
          {visibleClusters.map((cluster) => (
            <ClusterCard
              key={cluster.clusterId}
              cluster={cluster}
              isExpanded={expandedCluster === cluster.clusterId}
              onToggle={() =>
                setExpandedCluster((current) => (current === cluster.clusterId ? null : cluster.clusterId))
              }
            />
          ))}
        </main>
      )}
    </div>
  );
}

export default App;
