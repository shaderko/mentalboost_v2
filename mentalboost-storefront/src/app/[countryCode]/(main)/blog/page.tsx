import { Metadata } from "next"
import { listBlogPosts } from "@lib/data/blog"
import BlogList from "@modules/blog/templates/blog-list"

export const metadata: Metadata = {
  title: "Blog",
  description: "Read our latest articles and updates",
}

export default async function BlogPage() {
  const data = await listBlogPosts()
  const posts = data?.blog_posts || []

  return <BlogList posts={posts} />
}
