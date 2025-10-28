import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Table, Badge, Text } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { PencilSquare, Trash, Plus } from "@medusajs/icons"
import { useNavigate } from "react-router-dom"

const BlogListPage = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/admin/blog-posts", {
        credentials: "include",
      })
      const data = await response.json()
      setPosts(data.blog_posts || [])
    } catch (err) {
      setError("Failed to load blog posts")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return
    }

    try {
      const response = await fetch(`/admin/blog-posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        fetchPosts()
      } else {
        alert("Failed to delete blog post")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to delete blog post")
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const response = await fetch(`/admin/blog-posts/${id}/publish`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        fetchPosts()
      } else {
        alert("Failed to publish blog post")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to publish blog post")
    }
  }

  const handleUnpublish = async (id: string) => {
    try {
      const response = await fetch(`/admin/blog-posts/${id}/unpublish`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        fetchPosts()
      } else {
        alert("Failed to unpublish blog post")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to unpublish blog post")
    }
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

  if (loading) {
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
          <Text className="text-red-500">{error}</Text>
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
          onClick={() => navigate("/blog/new")}
        >
          <Plus />
          Create New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
          <Text className="text-ui-fg-subtle mb-4">No blog posts yet. Create your first post!</Text>
          <Button onClick={() => navigate("/blog/new")}>
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
                      onClick={() => handleDelete(post.id)}
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
