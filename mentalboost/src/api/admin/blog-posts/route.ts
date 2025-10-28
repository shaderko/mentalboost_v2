import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../modules/blog"
import BlogModuleService from "../../../modules/blog/service"
import { BlogPostStatus } from "../../../modules/blog/models/blog-post"

// GET /admin/blog-posts - List all blog posts with optional filters
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const { status, author, limit, offset } = req.query

  const posts = await blogService.listAllBlogPosts({
    ...(status && { status: status as BlogPostStatus }),
    ...(author && { author: author as string }),
    ...(limit && { limit: parseInt(limit as string) }),
    ...(offset && { offset: parseInt(offset as string) }),
  })

  res.json({ blog_posts: posts })
}

// POST /admin/blog-posts - Create a new blog post
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const {
    title,
    slug,
    excerpt,
    content,
    featured_image,
    status,
    author,
    meta_title,
    meta_description,
  } = req.body

  if (!title || !slug || !content) {
    return res.status(400).json({
      message: "Title, slug, and content are required",
    })
  }

  const post = await blogService.createBlogPost({
    title,
    slug,
    excerpt,
    content,
    featured_image,
    status: status || BlogPostStatus.DRAFT,
    author,
    meta_title,
    meta_description,
  })

  res.status(201).json({ blog_post: post })
}
