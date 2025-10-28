"use server"

import { sdk } from "@lib/config"
import { cache } from "react"

export const listBlogPosts = cache(async function (limit?: number, offset?: number) {
  const response = await sdk.client.fetch<{
    blog_posts: {
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
    }[]
  }>(`/store/blog-posts`, {
    method: "GET",
    query: {
      ...(limit && { limit: limit.toString() }),
      ...(offset && { offset: offset.toString() }),
    },
    cache: "force-cache",
    next: {
      tags: ["blog"],
    },
  })

  // The SDK returns the data directly in the response object, not in response.body
  return response as { blog_posts: any[] } || { blog_posts: [] }
})

export const getBlogPostBySlug = cache(async function (slug: string) {
  const response = await sdk.client.fetch<{
    blog_post: {
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
  }>(`/store/blog-posts/${slug}`, {
    method: "GET",
    cache: "force-cache",
    next: {
      tags: ["blog", `blog-${slug}`],
    },
  })

  // The SDK returns the data directly in the response object, not in response.body
  const data = response as { blog_post: any }

  if (!data || !data.blog_post) {
    throw new Error("Blog post not found")
  }

  return data
})
