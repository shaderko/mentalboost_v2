import { model } from "@medusajs/framework/utils"

export enum BlogPostStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

const BlogPost = model.define("blog_post", {
  id: model.id().primaryKey(),
  title: model.text(),
  slug: model.text().unique("IDX_BLOG_POST_SLUG"),
  excerpt: model.text().nullable(),
  content: model.text(),
  featured_image: model.text().nullable(),
  status: model.enum(BlogPostStatus).default(BlogPostStatus.DRAFT),
  author: model.text().nullable(),
  meta_title: model.text().nullable(),
  meta_description: model.text().nullable(),
  published_at: model.dateTime().nullable(),
})

export default BlogPost
