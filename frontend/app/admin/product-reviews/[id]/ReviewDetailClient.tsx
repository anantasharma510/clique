"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { reviewAdminService, type IAdminReview, type ReviewStatus } from "../../../../service/reviewAdminservice"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Star, Trash2, CheckCircle, EyeOff, Flag, AlertCircle, User, Package } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"

interface ReviewDetailClientProps {
  id: string
}

export default function ReviewDetailClient({ id }: ReviewDetailClientProps) {
  const router = useRouter()

  const [review, setReview] = useState<IAdminReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch review details
  const fetchReview = async () => {
    try {
      setLoading(true)
      const data = await reviewAdminService.getReviewById(id)
      setReview(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch review details.",
        variant: "error",
      })
      router.push("/admin/reviews")
    } finally {
      setLoading(false)
    }
  }

  // Handle status change
  const handleStatusChange = async (newStatus: ReviewStatus) => {
    if (!review) return

    try {
      setActionLoading(true)
      await reviewAdminService.updateReviewStatus(review._id, newStatus)

      // Update the review in the local state
      setReview({ ...review, status: newStatus })

      toast({
        title: "Status Updated",
        description: `Review status has been updated to ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update review status.",
        variant: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Handle review deletion
  const handleDeleteReview = async () => {
    if (!review) return

    try {
      setActionLoading(true)
      await reviewAdminService.deleteReview(review._id)

      toast({
        title: "Review Deleted",
        description: "The review has been successfully deleted.",
      })

      router.push("/admin/reviews")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the review.",
        variant: "error",
      })
    } finally {
      setActionLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" /> Active
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="w-3 h-3 mr-1" /> Pending
          </Badge>
        )
      case "hidden":
        return (
          <Badge className="bg-gray-500">
            <EyeOff className="w-3 h-3 mr-1" /> Hidden
          </Badge>
        )
      case "flagged":
        return (
          <Badge className="bg-red-500">
            <Flag className="w-3 h-3 mr-1" /> Flagged
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Render stars based on rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-5 h-5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  useEffect(() => {
    fetchReview()
  }, [id])

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/admin/reviews")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reviews
      </Button>

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : review ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Review Details</CardTitle>
              {getStatusBadge(review.status)}
            </div>
            <CardDescription>
              Review submitted on {format(new Date(review.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rating and Verification */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {renderStars(review.rating)}
                <span className="text-lg font-medium">{review.rating}/5</span>
              </div>

              <div>
                {review.isVerifiedPurchase ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Verified Purchase
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                    Unverified Purchase
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Review Comment */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Review Comment</h3>
              <div className="p-4 bg-muted rounded-md">
                {review.comment ? (
                  <p className="whitespace-pre-line">{review.comment}</p>
                ) : (
                  <p className="text-muted-foreground italic">No comment provided</p>
                )}
              </div>
            </div>

            <Separator />

            {/* User Information */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <User className="mr-2 h-5 w-5" /> User Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-md">
                  <div className="font-medium">Username</div>
                  <div>{review.userId.username}</div>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <div className="font-medium">Email</div>
                  <div>{review.userId.email}</div>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <div className="font-medium">User ID</div>
                  <div className="text-sm font-mono">{review.userId._id}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Product Information */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <Package className="mr-2 h-5 w-5" /> Product Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-md">
                  <div className="font-medium">Product Name</div>
                  <div>{review.productId.name}</div>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <div className="font-medium">Product ID</div>
                  <div className="text-sm font-mono">{review.productId._id}</div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t pt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleStatusChange("active")}
                disabled={review.status === "active" || actionLoading}
                className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange("pending")}
                disabled={review.status === "pending" || actionLoading}
                className="border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800"
              >
                <AlertCircle className="mr-2 h-4 w-4" /> Mark Pending
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange("hidden")}
                disabled={review.status === "hidden" || actionLoading}
                className="border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-800"
              >
                <EyeOff className="mr-2 h-4 w-4" /> Hide
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange("flagged")}
                disabled={review.status === "flagged" || actionLoading}
                className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
              >
                <Flag className="mr-2 h-4 w-4" /> Flag
              </Button>
            </div>

            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={actionLoading}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Review
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Review not found or has been deleted.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/reviews")}>
              Return to Reviews
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the review from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              disabled={actionLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 