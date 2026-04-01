export function Footer() {
  return (
    <footer className="mt-24 border-t border-zinc-100 px-0 py-4 dark:border-zinc-800">
      <div className="flex items-center justify-center">
        <span className="text-xs text-zinc-400 dark:text-zinc-600">
          &copy; {new Date().getFullYear()} Emiliano Borzelli
        </span>
      </div>
    </footer>
  )
}
