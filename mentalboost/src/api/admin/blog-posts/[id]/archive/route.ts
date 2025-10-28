import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../../modules/blog"
import BlogModuleService from "../../../../../modules/blog/service"

// POST /admin/blog-posts/:id/archive - Archive a blog post
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id } = req.params

  try {
    const post = await blogService.archiveBlogPost(id)
    res.json({ blog_post: post })
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to archive blog post",
    })
  }
}
