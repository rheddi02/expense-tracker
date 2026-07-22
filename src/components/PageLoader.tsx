export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-border"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin"></div>
        </div>
        {/* Loading text */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Loading your account</p>
          <p className="text-xs text-muted-foreground mt-1">Please wait...</p>
        </div>
      </div>
    </div>
  );
}
