import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import PostForm from '@/app/(admin)/admin/blog/_components/post-form'
import { updatePostAction } from '@/app/(admin)/admin/blog/actions'
import { assertPocketBaseId } from '@/lib/admin/validation'
import { getAdminPostById } from '@/lib/services/posts.service'

type EditBlogPostPageProps = {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function AdminEditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params
  assertPocketBaseId(id, 'post id')

  const post = await getAdminPostById(id)
  if (!post) notFound()
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1200px]">
        <Link
          href="/admin/blog"
          className="group inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-blue-600"
        >
          <ChevronLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          Back to posts
        </Link>
      </div>

      <PostForm
        action={updatePostAction.bind(null, id)}
        initial={post}
        submitLabel="Save post"
      />
    </div>
  )
}

