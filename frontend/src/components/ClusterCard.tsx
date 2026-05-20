import ArticleItem from './ArticleItem';

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
    description?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    summaryProvider?: 'gemini' | 'openai' | 'fallback';
    fallbackUsed?: boolean;
  }>;
};

type ClusterCardProps = {
  cluster: Cluster;
  isExpanded: boolean;
  onToggle: () => void;
};

export default function ClusterCard({ cluster, isExpanded, onToggle }: ClusterCardProps) {
  return (
    <section className={`cluster-card ${isExpanded ? 'expanded' : ''}`}>
      <button type="button" className="cluster-header" onClick={onToggle}>
        <div>
          <h2>{cluster.topic}</h2>
          <p>{cluster.articles.length} articles</p>
        </div>
        <span aria-hidden="true" className="chevron">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      <div className="keyword-row">
        {cluster.keywords.map((keyword) => (
          <span key={keyword} className="keyword-pill">
            {keyword}
          </span>
        ))}
      </div>

      <div className="cluster-body">
        {cluster.articles.map((article, index) => (
          <ArticleItem key={`${article.title ?? 'article'}-${index}`} article={article} />
        ))}
      </div>
    </section>
  );
}