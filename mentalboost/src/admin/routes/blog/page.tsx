import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Table, Badge, Text, usePrompt } from "@medusajs/ui"
import { PencilSquare, Trash, Plus } from "@medusajs/icons"
import { useNavigate } from "react-router-dom"
import {
  useBlogPosts,
  useDeleteBlogPost,
  usePublishBlogPost,
  useUnpublishBlogPost
} from "../../hooks/use-blog-posts"

const BlogListPage = () => {
  const navigate = useNavigate()
  const prompt = usePrompt()

  const { data, isLoading, error } = useBlogPosts()
  const { mutate: deleteBlogPost } = useDeleteBlogPost()
  const { mutate: publishBlogPost } = usePublishBlogPost()
  const { mutate: unpublishBlogPost } = useUnpublishBlogPost()

  const posts = data?.blog_posts || []

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await prompt({
      title: "Delete Blog Post",
      description: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (confirmed) {
      deleteBlogPost(id)
    }
  }

  const handlePublish = (id: string) => {
    publishBlogPost(id)
  }

  const handleUnpublish = (id: string) => {
    unpublishBlogPost(id)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge color="green">Published</Badge>
      case "draft":
        return <Badge color="orange">Draft</Badge>
      case "archived":
        return <Badge color="grey">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center p-8">
          <Text>Loading blog posts...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <div className="flex items-center justify-center p-8">
          <Text className="text-red-500">Failed to load blog posts</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading level="h1">Blog Posts</Heading>
        <Button
          variant="secondary"
          onClick={() => navigate("/blog/create")}
        >
          <Plus />
          Create New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
          <Text className="text-ui-fg-subtle mb-4">No blog posts yet. Create your first post!</Text>
          <Button onClick={() => navigate("/blog/create")}>
            <Plus />
            Create Post
          </Button>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>Slug</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Author</Table.HeaderCell>
              <Table.HeaderCell>Published At</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {posts.map((post: any) => (
              <Table.Row key={post.id}>
                <Table.Cell className="font-medium">{post.title}</Table.Cell>
                <Table.Cell>
                  <code className="text-xs bg-ui-bg-subtle px-2 py-1 rounded">{post.slug}</code>
                </Table.Cell>
                <Table.Cell>{getStatusBadge(post.status)}</Table.Cell>
                <Table.Cell>{post.author || "-"}</Table.Cell>
                <Table.Cell>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString()
                    : "-"}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => navigate(`/blog/${post.id}`)}
                    >
                      <PencilSquare />
                      Edit
                    </Button>
                    {post.status === "draft" && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handlePublish(post.id)}
                      >
                        Publish
                      </Button>
                    )}
                    {post.status === "published" && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleUnpublish(post.id)}
                      >
                        Unpublish
                      </Button>
                    )}
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => handleDelete(post.id, post.title)}
                    >
                      <Trash className="text-ui-fg-error" />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Blog",
})

export default BlogListPage
