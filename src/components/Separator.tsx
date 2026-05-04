export function LoginSeparator() {
  return (
    <div className="flex items-center gap-4 my-4">
      <div className="flex-1 h-px bg-gray-300" />
      <span className="text-sm text-gray-500 whitespace-nowrap">
        Login With
      </span>
      <div className="flex-1 h-px bg-gray-300" />
    </div>
  );
}