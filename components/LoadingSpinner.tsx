export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground sm:text-base">{text}</p>
    </div>
  )
}
