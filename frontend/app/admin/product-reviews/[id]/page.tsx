import { Suspense } from "react"
import ReviewDetailClient from "./ReviewDetailClient"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReviewDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewDetailClient id={id} />
    </Suspense>
  )
}
