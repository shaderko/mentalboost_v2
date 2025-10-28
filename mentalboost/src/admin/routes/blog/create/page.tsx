import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Textarea, Label, Select, toast } from "@medusajs/ui"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "@medusajs/icons"
import { useCreateBlogPost } from "../../../hooks/use-blog-posts"

const BlogPostCreatePage = () => {
  const navigate = useNavigate()

  const { mutate: createBlogPost, isPending: isSaving } = useCreateBlogPost({
    onSuccess: () => {
      navigate("/blog")
    },
  })

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    status: "draft",
    author: "",
    meta_title: "",
    meta_description: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-generate slug from title
    if (field === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.slug || !formData.content) {
      toast.error("Title, slug, and content are required")
      return
    }

    createBlogPost(formData)
  }

  return (
    <Container>
      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="transparent"
            onClick={() => navigate("/blog")}
          >
            <ArrowLeft />
          </Button>
          <Heading level="h1">Create New Blog Post</Heading>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter blog post title"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="blog-post-url-slug"
                required
              />
              <p className="text-xs text-ui-fg-subtle mt-1">
                URL: /store/blog-posts/{formData.slug || "your-slug"}
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleChange("excerpt", e.target.value)}
                placeholder="Short summary of the blog post"
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder="Write your blog post content here (supports markdown)"
                rows={15}
                required
              />
            </div>

            <div>
              <Label htmlFor="featured_image">Featured Image URL</Label>
              <Input
                id="featured_image"
                value={formData.featured_image}
                onChange={(e) => handleChange("featured_image", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => handleChange("author", e.target.value)}
                placeholder="Author name"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="draft">Draft</Select.Item>
                  <Select.Item value="published">Published</Select.Item>
                  <Select.Item value="archived">Archived</Select.Item>
                </Select.Content>
              </Select>
            </div>
          </div>

          <div className="border-t pt-6">
            <Heading level="h3" className="mb-4">
              SEO Settings
            </Heading>

            <div className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleChange("meta_title", e.target.value)}
                  placeholder="SEO meta title (leave empty to use post title)"
                />
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) =>
                    handleChange("meta_description", e.target.value)
                  }
                  placeholder="SEO meta description"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Post"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/blog")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Create Blog Post",
})

export default BlogPostCreatePage
