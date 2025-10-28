import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogModuleService from "../../../../modules/blog/service"

// GET /admin/blog-posts/:id - Retrieve a specific blog post
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id } = req.params

  try {
    const post = await blogService.retrieveBlogPost(id)
    res.json({ blog_post: post })
  } catch (error) {
    res.status(404).json({
      message: error.message || "Blog post not found",
    })
  }
}

// POST /admin/blog-posts/:id - Update a blog post
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id } = req.params

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

  try {
    const post = await blogService.updateBlogPost(id, {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content && { content }),
      ...(featured_image !== undefined && { featured_image }),
      ...(status && { status }),
      ...(author !== undefined && { author }),
      ...(meta_title !== undefined && { meta_title }),
      ...(meta_description !== undefined && { meta_description }),
    })

    res.json({ blog_post: post })
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to update blog post",
    })
  }
}

// DELETE /admin/blog-posts/:id - Delete a blog post
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id } = req.params

  try {
    await blogService.deleteBlogPost(id)
    res.json({
      id,
      deleted: true,
    })
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to delete blog post",
    })
  }
}
