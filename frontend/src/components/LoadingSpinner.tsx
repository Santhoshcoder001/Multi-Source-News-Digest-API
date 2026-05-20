export default function LoadingSpinner() {
  return (
    <div className="spinner-shell">
      <div className="spinner" aria-hidden="true" />
      <p>Fetching latest news...</p>
    </div>
  );
}