import { MedusaService } from "@medusajs/framework/utils"
import BlogPost, { BlogPostStatus } from "./models/blog-post"

type BlogPostData = {
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  status?: BlogPostStatus
  author?: string
  meta_title?: string
  meta_description?: string
  published_at?: Date
}

class BlogModuleService extends MedusaService({
  BlogPost,
}) {
  async createBlogPost(data: BlogPostData) {
    return await this.createBlogPosts(data)
  }

  async updateBlogPost(id: string, data: Partial<BlogPostData>) {
    return await this.updateBlogPosts({
      id,
      ...data,
    })
  }

  async retrieveBlogPost(id: string) {
    const posts = await this.listBlogPosts({ id })
    if (posts.length === 0) {
      throw new Error(`Blog post with id ${id} not found`)
    }
    return posts[0]
  }

  async retrieveBlogPostBySlug(slug: string) {
    const posts = await this.listBlogPosts({ slug })
    if (posts.length === 0) {
      throw new Error(`Blog post with slug ${slug} not found`)
    }
    return posts[0]
  }

  async listAllBlogPosts(filters?: {
    status?: BlogPostStatus
    author?: string
    limit?: number
    offset?: number
  }) {
    return await this.listBlogPosts(filters || {})
  }

  async publishBlogPost(id: string) {
    return await this.updateBlogPosts({
      id,
      status: BlogPostStatus.PUBLISHED,
      published_at: new Date(),
    })
  }

  async unpublishBlogPost(id: string) {
    return await this.updateBlogPosts({
      id,
      status: BlogPostStatus.DRAFT,
    })
  }

  async archiveBlogPost(id: string) {
    return await this.updateBlogPosts({
      id,
      status: BlogPostStatus.ARCHIVED,
    })
  }

  async deleteBlogPost(id: string) {
    return await this.deleteBlogPosts(id)
  }

  async getPublishedPosts(limit?: number, offset?: number) {
    return await this.listBlogPosts({
      status: BlogPostStatus.PUBLISHED,
      ...(limit && { limit }),
      ...(offset && { offset }),
    })
  }
}

export default BlogModuleService
