import Link from 'next/link'
import { Eye, EyeOff, SquarePen } from 'lucide-react'

import { deletePostAction, togglePostPublishedAction } from '@/app/(admin)/admin/blog/actions'
import { DeletePostButton } from '@/app/(admin)/admin/blog/_components/delete-post-button'
import { getAdminPosts } from '@/lib/services/posts.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const metadata = {
  title: 'Chia Charged | Admin Blog',
  description: 'Manage your blog posts',
  robots: 'noindex, nofollow',
}

export default async function AdminBlogPage() {
  const posts = await getAdminPosts()

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
            Content
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>Blog</h1>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Manage your posts.</p>
        </div>
        <Link
          href="/admin/blog/create"
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#4F46E5' }}
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl p-8 text-sm" style={{ border: '2px dashed #E8EAED', color: '#9CA3AF' }}>
          No posts yet.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col gap-4 bg-transparent p-2 md:flex-row md:items-start"
            >
              <div className="aspect-video w-full shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-zinc-800 md:w-100">
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-500 dark:text-zinc-400">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="truncate text-xl font-bold text-slate-900 dark:text-zinc-100">{post.title}</h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      aria-label={`Edit ${post.title}`}
                      className="rounded-lg p-2 text-white transition-opacity hover:opacity-80" style={{ background: '#4F46E5' }}
                    >
                      <SquarePen className="h-4 w-4" />
                    </Link>

                    <form action={togglePostPublishedAction.bind(null, post.id, !post.published)}>
                      <button
                        type="submit"
                        aria-label={post.published ? `Hide ${post.title}` : `Publish ${post.title}`}
                        className="rounded-lg p-2 cursor-pointer text-white transition-opacity hover:opacity-80" style={{ background: '#6B7280' }}
                      >
                        {post.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </form>

                    <DeletePostButton action={deletePostAction.bind(null, post.id)} title={post.title} />
                  </div>
                </div>
                <p className="line-clamp-2 text-base text-slate-600 dark:text-zinc-300">{post.excerpt || 'No excerpt.'}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      post.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">
                    {post.updated ? new Date(post.updated).toLocaleDateString('en-US') : '-'}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
