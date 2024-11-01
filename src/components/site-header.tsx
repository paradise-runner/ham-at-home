import Link from "next/link"
import { ThemeToggle } from "./toggle-theme"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center mx-auto">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex flex-row items-center space-x-2">
            <span className="inline-block font-bold">🐷@🏠</span>
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/about"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
            >
              About
            </Link>
            <a
              href="https://hec.works"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Portfolio
            </a>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}