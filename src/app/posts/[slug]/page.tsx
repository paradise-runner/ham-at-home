import Image from "next/image"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import dynamic from 'next/dynamic';
import fm from "front-matter";

// Import types but keep the metadata generation functions
interface Post {
  slug: string
  title: string
  description: string
  date: string
  coverImage?: string
  content: string
}

interface Props {
  params: {
    slug: string
  }
}

export const revalidate = false

// Generate all possible paths at build time
export async function generateStaticParams() {
  // You'll need to maintain a list of valid slugs or use a build script
  // to generate this list based on files in your markdown directory
  const slugs = process.env.MARKDOWN_SLUGS?.split(',') || []
  return slugs.map((slug) => ({
    slug,
  }))
}

export default async function PostPage({ params }: Props) {
  const Module = dynamic(() => import(`@/markdown/posts/${params.slug}.md`));

  return (
    <article className="container mx-auto px-4 py-8 prose prose-slate dark:prose-invert lg:prose-lg max-w-4xl">
      <Module/>

    </article>
  )
}

export const runtime = 'edge';