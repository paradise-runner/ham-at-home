// app/about/page.tsx
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getAllTags } from "@/lib/blog"
import type { Metadata } from "next"
import { Github, Twitter, AlertCircle, Info, Zap, TriangleAlertIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: "About Me",
  description: "Learn more about me and my AI-powered blog automation project.",
  openGraph: {
    title: "About Me",
    description: "Learn more about me and my AI-powered blog automation project.",
    type: "profile",
  },
}

export default async function AboutPage() {
  const tags = await getAllTags()
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden shrink-0 mx-auto md:mx-0">
            <Image
              src="/images/profile.jpg"
              alt="Profile photo"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 128px, 192px"
            />
          </div>
          
          <div>
            <h1 className="text-4xl font-bold mb-4 text-center md:text-left">
              Hi, I'm Edward Champion 👋
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Exploring AI-driven automation for blogging. This site is an experiment in using AI tools to enhance content creation and management.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
            <Button asChild variant="outline">
                <Link href="https://github.com/paradise-runner">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 mr-2"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 mr-2"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            <TriangleAlertIcon className="inline-block mr-2" /> Disclaimer
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              Please note that all content on this website is generated by AI. While efforts are made to ensure accuracy and relevance, the information provided may not always reflect human expertise or opinions.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            <Info className="inline-block mr-2" /> About This Blog
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              The name of the website "Hame At Home" or "🐷@🏠" is a play on the common phrase "We have X at home" that parents always give as a reason why we don't need something from a shop. The joke being that whatever is at home is usually worse, i.e "We have Ham at home" -&gt; "We have spam at home". And this entire blog is a personal mental exercise in what a personal computer can achieve in terms of raw content generation from both open source implementations running on bare home metal, to calling cloud providers. Or, what kind of spam can we make at home?
            </p>
           </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            <Zap className="inline-block mr-2" /> Exploring AI in Blogging
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Content Generation ✍️</h3>
                <p className="text-muted-foreground">
                  Experimenting with AI to assist in generating blog post ideas, outlines, and even drafting entire articles.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Automation 🤖</h3>
                <p className="text-muted-foreground">
                  Exploring how AI can automate tasks like SEO optimization, social media posting, and content scheduling.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>


        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Topics (A)I Write About 📚</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted/80"
              >
                #{tag} ({count})
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
          <p className="text-muted-foreground mb-4">
            Have questions or want to collaborate? Feel free to reach out through
            any of my social media channels or send me an email at{' '}
            <Link 
              href="mailto:edward@hec.works"
              className="text-primary hover:underline"
            >
              edward@hec.works
            </Link>
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/posts">Read the Blog</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="mailto:edward@hec.works">Contact Me</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
