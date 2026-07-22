export function LoginSeparator() {
  return (
    <div className="flex items-center gap-4 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Login With
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}