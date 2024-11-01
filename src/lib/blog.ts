// blog.ts
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import remarkGfm from 'remark-gfm'

const postsDirectory = path.join(process.cwd(), 'src/markdown/posts')

export interface PostFrontMatter {
  title: string
  date: string
  description: string
  coverImage?: string
  tags: string[]
  category: string
}

export interface BlogPost extends PostFrontMatter {
  slug: string
  content: string
}

// Predefined categories
export const CATEGORIES = [
  'Development',
  'Travel',
  'Lifestyle',
  'Technology',
  'Food',
  'Health',
] as const

export type Category = typeof CATEGORIES[number]

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    
    const tags = Array.isArray(data.tags) ? data.tags : []
    const category = CATEGORIES.includes(data.category) ? data.category : 'Development'
    
    const processedContent = await remark()
      .use(html)
      .use(remarkGfm)
      .process(content)
    
    return {
      slug,
      content: processedContent.toString(),
      title: data.title,
      date: data.date,
      description: data.description,
      coverImage: data.coverImage,
      tags,
      category,
    }
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error)
    return null
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const files = fs.readdirSync(postsDirectory)
    const posts = await Promise.all(
      files
        .filter((file) => file.endsWith('.md'))
        .map(async (file) => await getPostBySlug(file.replace(/\.md$/, '')))
    )

    return posts
      .filter((post): post is BlogPost => post !== null)
      .sort((a, b) => (new Date(b.date)).getTime() - (new Date(a.date)).getTime())
  } catch (error) {
    console.error('Error getting all posts:', error)
    return []
  }
}

export function getTagsFromPosts(posts: BlogPost[]): { tag: string; count: number }[] {
  const tagCounts = posts.reduce((acc, post) => {
    post.tags.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const posts = await getAllPosts()
  return getTagsFromPosts(posts)
}

export async function getAllCategories(): Promise<{ category: Category; count: number }[]> {
  const posts = await getAllPosts()
  
  const categoryCounts = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return CATEGORIES.map(category => ({
    category,
    count: categoryCounts[category] || 0
  }))
}

export async function getCategoryCount(): Promise<{ category: Category; count: number }[]> {
  const posts = await getAllPosts()
  
  const categoryCounts = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return CATEGORIES.map(category => ({
    category,
    count: categoryCounts[category] || 0
  }))
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.category === category)
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.tags.includes(tag))
}