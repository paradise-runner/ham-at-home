import { Metadata } from "next"
import { getPostsByTag, getAllTags } from "@/lib/blog"
import PostCard from "@/components/post-card"

interface Props {
  params: {
    tag: string
  }
}

export async function generateStaticParams() {
  const tags = await getAllTags()
  return tags.map(({ tag }) => ({
    tag: encodeURIComponent(tag),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag)
  return {
    title: `Posts tagged with "${tag}"`,
    description: `View all blog posts tagged with "${tag}"`,
  }
}

export default async function TagPage({ params }: Props) {
  const tag = decodeURIComponent(params.tag)
  const posts = await getPostsByTag(tag)

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Posts tagged with "#{tag}"</h1>
        <p className="text-muted-foreground">{posts.length} posts</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
