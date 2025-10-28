import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBlogPostBySlug } from "@lib/data/blog"
import BlogPost from "@modules/blog/templates/blog-post"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  try {
    const { blog_post } = await getBlogPostBySlug(slug)

    return {
      title: blog_post.meta_title || blog_post.title,
      description: blog_post.meta_description || blog_post.excerpt,
      openGraph: {
        title: blog_post.meta_title || blog_post.title,
        description: blog_post.meta_description || blog_post.excerpt,
        ...(blog_post.featured_image && {
          images: [
            {
              url: blog_post.featured_image,
            },
          ],
        }),
      },
    }
  } catch (error) {
    return {
      title: "Blog Post Not Found",
    }
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  try {
    const { blog_post } = await getBlogPostBySlug(slug)
    return <BlogPost post={blog_post} />
  } catch (error) {
    notFound()
  }
}
