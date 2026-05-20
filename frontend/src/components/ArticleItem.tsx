type ArticleItemProps = {
  article: {
    title?: string;
    url?: string;
    source?: string;
    publishedAt?: string;
    summary?: string;
    description?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    summaryProvider?: 'gemini' | 'openai' | 'fallback';
    fallbackUsed?: boolean;
  };
};

function formatRelativeTime(isoString?: string) {
  if (!isoString) {
    return 'just now';
  }

  const timestamp = new Date(isoString).getTime();

  if (Number.isNaN(timestamp)) {
    return 'just now';
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export default function ArticleItem({ article }: ArticleItemProps) {
  const sentiment = article.sentiment ?? 'neutral';
  const sentimentLabel =
    sentiment === 'positive' ? '😊 Positive' : sentiment === 'negative' ? '😟 Negative' : '😐 Neutral';
  
  // Display priority: summary OR description OR fallback message
  const displaySummary = article.summary || article.description || 'No summary available';
  
  // Provider badge label
  const providerLabel = article.summaryProvider === 'gemini' ? 'Gemini' 
    : article.summaryProvider === 'openai' ? 'OpenAI' 
    : article.summaryProvider === 'fallback' ? 'Fallback' 
    : 'Local';

  return (
    <article className="article-item">
      <div className="article-topline">
        <a href={article.url} target="_blank" rel="noreferrer">
          {article.title ?? 'Untitled'}
        </a>
        <span className={`sentiment sentiment-${sentiment}`}>{sentimentLabel}</span>
      </div>
      <p className="article-meta">
        <span>{article.source ?? 'Unknown source'}</span>
        <span>•</span>
        <span>{formatRelativeTime(article.publishedAt)}</span>
        <span>•</span>
        <span className={`provider-badge provider-${article.summaryProvider ?? 'local'}`}>{providerLabel}</span>
      </p>
      <p className="article-summary">{displaySummary}</p>
    </article>
  );
}

export { formatRelativeTime };