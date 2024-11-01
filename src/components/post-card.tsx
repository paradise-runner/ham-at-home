import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TagList } from "@/components/tag-list"
import type { BlogPost } from "@/lib/blog"

interface PostCardProps {
  post: BlogPost
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      {post.coverImage && (
        <div className="relative w-full h-48">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle>
          <Link href={`/posts/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription>{new Date(post.date).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-muted-foreground mb-4">{post.description}</p>
        <TagList tags={post.tags} className="mb-4" />
        <Button asChild className="mt-auto">
          <Link href={`/posts/${post.slug}`}>Read more</Link>
        </Button>
      </CardContent>
    </Card>
  )
}