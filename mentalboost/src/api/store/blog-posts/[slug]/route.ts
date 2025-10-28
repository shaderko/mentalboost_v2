import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogModuleService from "../../../../modules/blog/service"
import { BlogPostStatus } from "../../../../modules/blog/models/blog-post"

// GET /store/blog-posts/:slug - Retrieve a published blog post by slug
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { slug } = req.params

  try {
    const post = await blogService.retrieveBlogPostBySlug(slug)

    // Only return published posts to store customers
    if (post.status !== BlogPostStatus.PUBLISHED) {
      return res.status(404).json({
        message: "Blog post not found",
      })
    }

    res.json({ blog_post: post })
  } catch (error) {
    res.status(404).json({
      message: "Blog post not found",
    })
  }
}
