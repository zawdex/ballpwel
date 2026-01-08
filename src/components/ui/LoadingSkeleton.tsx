const LoadingSkeleton = () => {
  return (
    <div className="match-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 bg-secondary rounded-full" />
          <div className="h-6 w-20 bg-secondary rounded-full" />
        </div>
        <div className="h-4 w-12 bg-secondary rounded" />
      </div>
      
      <div className="h-4 w-32 bg-secondary rounded mb-4" />
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary" />
          <div className="h-4 w-24 bg-secondary rounded" />
        </div>
        <div className="h-8 w-12 bg-secondary rounded" />
        <div className="flex-1 flex items-center gap-3 justify-end">
          <div className="h-4 w-24 bg-secondary rounded" />
          <div className="w-10 h-10 rounded-full bg-secondary" />
        </div>
      </div>
      
      <div className="h-10 w-full bg-secondary rounded-lg mt-4" />
    </div>
  );
};

export default LoadingSkeleton;
