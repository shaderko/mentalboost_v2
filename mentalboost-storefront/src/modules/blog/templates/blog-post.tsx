import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowLeft } from "@medusajs/icons"

type BlogPostProps = {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    featured_image: string | null
    author: string | null
    published_at: string | null
  }
}

export default function BlogPost({ post }: BlogPostProps) {
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <div className="content-container py-8">
      <LocalizedClientLink
        href="/blog"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft size={20} />
        Back to Blog
      </LocalizedClientLink>

      <article className="max-w-3xl mx-auto">
        {post.featured_image && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-8">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-4">{post.excerpt}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-b py-4">
            {post.author && <span>By {post.author}</span>}
            {publishedDate && <span>{publishedDate}</span>}
          </div>
        </header>

        <div
          className="prose prose-lg max-w-none
            prose-headings:font-bold
            prose-h1:text-3xl
            prose-h2:text-2xl
            prose-h3:text-xl
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg
            prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
            prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-gray-900 prose-pre:text-gray-100
            prose-ul:list-disc prose-ul:pl-6
            prose-ol:list-decimal prose-ol:pl-6
            prose-li:text-gray-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  )
}
