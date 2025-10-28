import BlogCard from "../components/blog-card"

type BlogListProps = {
  posts: {
    id: string
    title: string
    slug: string
    excerpt: string
    featured_image: string | null
    author: string | null
    published_at: string | null
  }[]
}

export default function BlogList({ posts }: BlogListProps) {
  if (posts.length === 0) {
    return (
      <div className="content-container py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Blog</h1>
          <p className="text-gray-600">No blog posts yet. Check back soon!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-gray-600">Read our latest articles and updates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
