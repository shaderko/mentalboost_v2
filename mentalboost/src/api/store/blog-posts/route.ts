import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../modules/blog"
import BlogModuleService from "../../../modules/blog/service"

// GET /store/blog-posts - List published blog posts
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const { limit, offset } = req.query

  const posts = await blogService.getPublishedPosts(
    limit ? parseInt(limit as string) : undefined,
    offset ? parseInt(offset as string) : undefined
  )

  res.json({ blog_posts: posts })
}
