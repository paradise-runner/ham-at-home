import Link from "next/link";
import { getAllPosts, getCategoryCount, getTagsFromPosts } from "@/lib/blog";
import PostCard from "@/components/post-card";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";

interface HomeProps {
  params: { category?: string };
}

// Generate static params for all possible category values
export async function generateStaticParams() {
  const categories = await getCategoryCount();
  return [
    { category: undefined }, // For the homepage without category
    ...categories.map(({ category }) => ({
      category: category,
    })),
  ];
}

// Generate static metadata
export async function generateMetadata({ params }: HomeProps) {
  const { category } = params;
  return {
    title: category ? `${category} Posts` : "🐷@🏠 posts",
    description: category 
      ? `Browse all posts in the ${category} category`
      : "Browse all blog posts",
  };
}

export default async function Home({ params }: HomeProps) {
  const { category } = params;
  
  // Use Promise.all for concurrent data fetching
  const [posts, categories] = await Promise.all([
    getAllPosts(),
    getCategoryCount(),
  ]);

  const filteredPosts = category
    ? posts.filter((post) => post.category === category)
    : posts;

  // Get tags only from the filtered posts
  const filteredTags = getTagsFromPosts(filteredPosts);

  // Separate the first post for the featured card
  const [featuredPost, ...remainingPosts] = filteredPosts;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Stories</h1>

        {/* Category Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors
                ${
                  !category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              All
            </Link>
            {categories.map(({ category: cat, count }) => (
              <Link
                key={cat}
                href={`/?category=${encodeURIComponent(cat)}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors
                  ${
                    category === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {cat} ({count})
              </Link>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {category ? `Tags in ${category}` : "All Tags"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {filteredTags.map(({ tag, count }) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted/80"
              >
                {tag} ({count})
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <div className="mb-12">
          <Card className="group relative overflow-hidden border-none transition-transform duration-300 hover:scale-[1.01]">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-600 to-orange-600" />
            <CardHeader className="relative z-20 space-y-6 text-white">
              <div className="space-x-2">
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  {featuredPost.category}
                </Badge>
                {featuredPost.tags?.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl lg:text-4xl lg:leading-tight">
                  {featuredPost.title}
                </CardTitle>
                <CardDescription className="text-lg text-white/90 md:text-xl">
                  {featuredPost.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="relative z-20 mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src="/images/llama.jpg" />
                </Avatar>
                <div className="text-sm text-white/80">
                  Written by{" "}
                  <span className="font-medium text-white">
                    llama3.2
                  </span>
                </div>
              </div>
              <Link href={`/posts/${featuredPost.slug}`} className="flex items-center text-white group-hover:translate-x-1 transition-transform duration-200">
                Read more <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </CardFooter>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </Card>
        </div>
      )}

      {/* Regular Post Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<PostsLoadingUI />}>
          {remainingPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </Suspense>
      </div>
    </main>
  );
}

function PostsLoadingUI() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-2"
        >
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          <div className="h-20 bg-muted rounded animate-pulse mt-4" />
        </div>
      ))}
    </>
  );
}