import { Metadata } from "next"
import { getPostsByCategory, getAllCategories } from "@/lib/blog"
import PostCard from "@/components/post-card"

interface Props {
  params: {
    category: string
  }
}

export async function generateStaticParams() {
  const categories = await getAllCategories()
  return categories.map(({ category }) => ({
    category: encodeURIComponent(category),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = decodeURIComponent(params.category)
  return {
    title: `Posts in the "${category} category"`,
    description: `View all blog posts tagged with "${category}"`,
  }
}

export default async function TagPage({ params }: Props) {
  const category = decodeURIComponent(params.category)
  const posts = await getPostsByCategory(category)

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Posts in the "{category}" Category</h1>
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
