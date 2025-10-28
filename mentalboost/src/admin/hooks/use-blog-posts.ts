import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { sdk } from "../lib/sdk"

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string | null
  status: string
  author: string | null
  meta_title: string | null
  meta_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

type BlogPostsResponse = {
  blog_posts: BlogPost[]
}

type BlogPostResponse = {
  blog_post: BlogPost
}

type CreateBlogPostData = {
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  status?: string
  author?: string
  meta_title?: string
  meta_description?: string
}

type UpdateBlogPostData = Partial<CreateBlogPostData>

// Query hook - List all blog posts
export const useBlogPosts = () => {
  return useQuery<BlogPostsResponse>({
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/blog-posts")
      return response as BlogPostsResponse
    },
    queryKey: ["blog-posts"],
  })
}

// Query hook - Get single blog post
export const useBlogPost = (id: string) => {
  return useQuery<BlogPostResponse>({
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/blog-posts/${id}`)
      return response as BlogPostResponse
    },
    queryKey: ["blog-post", id],
    enabled: !!id,
  })
}

// Mutation hook - Create blog post
export const useCreateBlogPost = (
  options?: UseMutationOptions<BlogPostResponse, Error, CreateBlogPostData>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBlogPostData) => {
      const response = await sdk.client.fetch("/admin/blog-posts", {
        method: "POST",
        body: data,
      })
      return response as BlogPostResponse
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
      toast.success("Blog post created!")
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create blog post")
    },
    ...options,
  })
}

// Mutation hook - Update blog post
export const useUpdateBlogPost = (
  id: string,
  options?: UseMutationOptions<BlogPostResponse, Error, UpdateBlogPostData>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateBlogPostData) => {
      const response = await sdk.client.fetch(`/admin/blog-posts/${id}`, {
        method: "POST",
        body: data,
      })
      return response as BlogPostResponse
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
      queryClient.invalidateQueries({ queryKey: ["blog-post", id] })
      toast.success("Blog post updated!")
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update blog post")
    },
    ...options,
  })
}

// Mutation hook - Delete blog post
export const useDeleteBlogPost = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await sdk.client.fetch(`/admin/blog-posts/${id}`, {
        method: "DELETE",
      })
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
      toast.success("Blog post deleted!")
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete blog post")
    },
    ...options,
  })
}

// Mutation hook - Publish blog post
export const usePublishBlogPost = (
  options?: UseMutationOptions<BlogPostResponse, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/blog-posts/${id}/publish`, {
        method: "POST",
      })
      return response as BlogPostResponse
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
      queryClient.invalidateQueries({ queryKey: ["blog-post", variables] })
      toast.success("Blog post published!")
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to publish blog post")
    },
    ...options,
  })
}

// Mutation hook - Unpublish blog post
export const useUnpublishBlogPost = (
  options?: UseMutationOptions<BlogPostResponse, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/blog-posts/${id}/unpublish`, {
        method: "POST",
      })
      return response as BlogPostResponse
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
      queryClient.invalidateQueries({ queryKey: ["blog-post", variables] })
      toast.success("Blog post unpublished!")
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unpublish blog post")
    },
    ...options,
  })
}
