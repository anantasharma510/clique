"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface WishlistIconProps {
  count?: number
  onClick?: () => void
}

export default function WishlistIcon({ count = 0, onClick }: WishlistIconProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 rounded-full bg-gradient-to-r from-pink-500/10 to-red-500/10 hover:from-pink-500/20 hover:to-red-500/20 transition-all duration-300 hover:scale-110 group"
      onClick={onClick}
    >
      <Heart className="h-5 w-5 text-pink-600 group-hover:text-red-500 transition-colors duration-300 group-hover:fill-current" />
      {count > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-pink-500 to-red-500 text-white border-2 border-white shadow-lg animate-pulse">
          {count}
        </Badge>
      )}
      <span className="sr-only">wishlist ({count} items)</span>
    </Button>
  )
}
