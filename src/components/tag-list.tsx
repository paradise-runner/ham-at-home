import Link from 'next/link'

interface TagListProps {
  tags: string[]
  className?: string
}

export function TagList({ tags, className = '' }: TagListProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/tags/${encodeURIComponent(tag)}`}
          className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted/80"
        >
          {tag}
        </Link>
      ))}
    </div>
  )
}