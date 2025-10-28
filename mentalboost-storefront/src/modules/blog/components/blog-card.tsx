import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

type BlogCardProps = {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string
    featured_image: string | null
    author: string | null
    published_at: string | null
  }
}

export default function BlogCard({ post }: BlogCardProps) {
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <LocalizedClientLink
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
    >
      {post.featured_image && (
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
        )}
        <div className="flex items-center justify-between text-sm text-gray-500">
          {post.author && <span>By {post.author}</span>}
          {publishedDate && <span>{publishedDate}</span>}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
