function LoadingSkeleton() {
  return (
    <div className="image-skeleton-stack" aria-label="Analysis loading">
      <div className="image-skeleton image-skeleton-lg" />
      <div className="image-skeleton-row">
        <div className="image-skeleton" />
        <div className="image-skeleton" />
      </div>
      <div className="image-skeleton image-skeleton-sm" />
    </div>
  );
}

export default LoadingSkeleton;
