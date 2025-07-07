"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronRight,
  Filter,
  Loader2,
  Grid3X3,
  List,
  ShoppingBag,
  Star,
  Search,
  X,
  ArrowUpDown,
  Heart,
  Eye,
  ShoppingCart,
  ArrowRight,
  Check,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import Navbar from "@/app/(root)/components/navbar/navbar"
import Footer from "@/app/(root)/components/footer/footer"
import publicSubcategoryService, { type PublicSubcategory } from "@/service/public/publicSubcategoryService"
import ProductService, { type ProductDetails, type ProductFilterOptions } from "@/service/public/Productservice"

export default function SubcategoryPage({ params }: { params: Promise<{ slug: string; subcategory: string }> }) {
  // Unwrap the params Promise
  const resolvedParams = use(params)

  const [subcategory, setSubcategory] = useState<PublicSubcategory | null>(null)
  const [products, setProducts] = useState<ProductDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState("featured")
  const [viewMode, setViewMode] = useState("grid")
  const [priceRange, setPriceRange] = useState([1000, 15000])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([])
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([])
  const [cashOnDeliveryOnly, setCashOnDeliveryOnly] = useState(false)
  const [hasWarranty, setHasWarranty] = useState(false)
  const [hasReturnPolicy, setHasReturnPolicy] = useState(false)

  // Helper function to calculate final price
  const getFinalPrice = (product: ProductDetails) => {
    return product.discountPrice || product.originalPrice || 0
  }

  // Helper function to calculate discount percentage
  const getDiscountPercentage = (product: ProductDetails) => {
    if (product.discountPrice && product.originalPrice) {
      return Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100)
    }
    return 0
  }

  const fetchProducts = async (subcategoryId: string, options: ProductFilterOptions = {}) => {
    try {
      setProductsLoading(true)
      const response = await ProductService.getProductsBySubcategory(subcategoryId, {
        page: currentPage,
        limit: 12,
        sort: sortOption as any,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        search: searchQuery,
        brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
        ...options,
      })
      setProducts(response.products)
      setTotalPages(response.pages)
      setTotalProducts(response.count)

      // Extract unique brands from products
      if (response.products.length > 0) {
        const brands = [...new Set(response.products.map((p) => p.brand).filter(Boolean))] as string[]
        const colors = [...new Set(response.products.flatMap((p) => p.colors || []))]
        const sizes = [...new Set(response.products.flatMap((p) => p.sizes || []))]
        const materials = [...new Set(response.products.map((p) => p.brand).filter(Boolean))] as string[]
        const features = [...new Set(response.products.flatMap((p) => p.features || []))]

        setAvailableBrands(brands)
        setAvailableColors(colors)
        setAvailableSizes(sizes)
        setAvailableMaterials(materials)
        setAvailableFeatures(features)
      }

      // Update active filters
      const filters = []
      if (priceRange[0] > 1000 || priceRange[1] < 15000) filters.push("Price")
      if (selectedBrands.length > 0) filters.push("Brand")
      if (selectedColors.length > 0) filters.push("Colors")
      if (selectedSizes.length > 0) filters.push("Sizes")
      if (selectedMaterials.length > 0) filters.push("Materials")
      if (selectedFeatures.length > 0) filters.push("Features")
      if (inStockOnly) filters.push("In Stock Only")
      if (cashOnDeliveryOnly) filters.push("Cash on Delivery")
      if (hasWarranty) filters.push("With Warranty")
      if (hasReturnPolicy) filters.push("Return Policy")
      if (searchQuery) filters.push("Search")
      setActiveFilters(filters)
    } catch (err) {
      console.warn("Failed to fetch products:", err)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    const fetchSubcategory = async () => {
      if (!resolvedParams.slug || !resolvedParams.subcategory) return

      try {
        setLoading(true)
        const data = await publicSubcategoryService.getPublicSubcategoryBySlug(
          resolvedParams.slug,
          resolvedParams.subcategory,
        )
        setSubcategory(data)

        // Fetch products for this subcategory
        await fetchProducts(data._id)
      } catch (err: any) {
        setError(err.message || "Failed to fetch subcategory details.")
      } finally {
        setLoading(false)
      }
    }

    fetchSubcategory()
  }, [resolvedParams.slug, resolvedParams.subcategory])

  // Refetch products when filters change
  useEffect(() => {
    if (subcategory) {
      fetchProducts(subcategory._id)
    }
  }, [
    sortOption,
    priceRange,
    currentPage,
    searchQuery,
    selectedBrands,
    selectedColors,
    selectedSizes,
    selectedMaterials,
    selectedFeatures,
    inStockOnly,
    cashOnDeliveryOnly,
    hasWarranty,
    hasReturnPolicy,
  ])

  const clearFilters = () => {
    setPriceRange([1000, 15000])
    setSelectedBrands([])
    setSelectedColors([])
    setSelectedSizes([])
    setSelectedMaterials([])
    setSelectedFeatures([])
    setInStockOnly(false)
    setCashOnDeliveryOnly(false)
    setHasWarranty(false)
    setHasReturnPolicy(false)
    setSearchQuery("")
    setCurrentPage(1)
  }

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]))
  }

  const removeFilter = (filter: string) => {
    if (filter === "Price") setPriceRange([1000, 15000])
    if (filter === "Brand") setSelectedBrands([])
    if (filter === "Colors") setSelectedColors([])
    if (filter === "Sizes") setSelectedSizes([])
    if (filter === "Materials") setSelectedMaterials([])
    if (filter === "Features") setSelectedFeatures([])
    if (filter === "In Stock Only") setInStockOnly(false)
    if (filter === "Cash on Delivery") setCashOnDeliveryOnly(false)
    if (filter === "With Warranty") setHasWarranty(false)
    if (filter === "Return Policy") setHasReturnPolicy(false)
    if (filter === "Search") setSearchQuery("")
  }

  const handleColorToggle = (color: string) => {
    setSelectedColors((prev) => (prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]))
  }

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]))
  }

  const handleMaterialToggle = (material: string) => {
    setSelectedMaterials((prev) => (prev.includes(material) ? prev.filter((m) => m !== material) : [...prev, material]))
  }

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures((prev) => (prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]))
  }

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center text-slate-900">
          <Filter className="h-4 w-4 mr-2 text-amber-700" />
          Filters
        </h3>
        {activeFilters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="border-amber-200 text-amber-800 hover:bg-amber-50 text-xs px-2 py-1 h-auto"
            onClick={clearFilters}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center gap-1 px-2 py-1"
              onClick={() => removeFilter(filter)}
            >
              {filter}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="space-y-2">
        <label htmlFor="search" className="text-sm font-medium text-slate-700">
          Search Products
        </label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            id="search"
            placeholder="Search in this subcategory"
            className="pl-8 border-slate-200 focus:border-amber-300 focus:ring-amber-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <Separator className="bg-slate-200" />

      <Accordion type="multiple" defaultValue={["price", "availability"]} className="space-y-4">
        <AccordionItem value="price" className="border-slate-200">
          <AccordionTrigger className="text-slate-900 hover:text-amber-800 py-3">
            <span className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-amber-700" />
              Price Range
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 px-1">
              <Slider
                defaultValue={priceRange}
                min={1000}
                max={15000}
                step={500}
                value={priceRange}
                onValueChange={setPriceRange}
                className="mt-2"
              />
              <div className="flex items-center justify-between">
                <div className="bg-white border border-slate-200 rounded-md px-2 py-1 text-sm text-slate-900 font-medium">
                  NPR {priceRange[0].toLocaleString()}
                </div>
                <div className="text-sm text-slate-500">to</div>
                <div className="bg-white border border-slate-200 rounded-md px-2 py-1 text-sm text-slate-900 font-medium">
                  NPR {priceRange[1].toLocaleString()}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="availability" className="border-slate-200">
          <AccordionTrigger className="text-slate-900 hover:text-amber-800 py-3">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber-700" />
              Availability & Services
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="in-stock"
                  checked={inStockOnly}
                  onCheckedChange={() => setInStockOnly(!inStockOnly)}
                  className="text-amber-800 border-slate-300 data-[state=checked]:bg-amber-800 data-[state=checked]:border-amber-800"
                />
                <label htmlFor="in-stock" className="text-sm font-medium">
                  In Stock Only
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cash-delivery"
                  checked={cashOnDeliveryOnly}
                  onCheckedChange={() => setCashOnDeliveryOnly(!cashOnDeliveryOnly)}
                  className="text-amber-800 border-slate-300 data-[state=checked]:bg-amber-800 data-[state=checked]:border-amber-800"
                />
                <label htmlFor="cash-delivery" className="text-sm font-medium">
                  Cash on Delivery
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="warranty"
                  checked={hasWarranty}
                  onCheckedChange={() => setHasWarranty(!hasWarranty)}
                  className="text-amber-800 border-slate-300 data-[state=checked]:bg-amber-800 data-[state=checked]:border-amber-800"
                />
                <label htmlFor="warranty" className="text-sm font-medium">
                  With Warranty
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="return-policy"
                  checked={hasReturnPolicy}
                  onCheckedChange={() => setHasReturnPolicy(!hasReturnPolicy)}
                  className="text-amber-800 border-slate-300 data-[state=checked]:bg-amber-800 data-[state=checked]:border-amber-800"
                />
                <label htmlFor="return-policy" className="text-sm font-medium">
                  Return Policy Available
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {availableColors.length > 0 && (
          <AccordionItem value="colors" className="border-slate-200">
            <AccordionTrigger className="text-slate-900 hover:text-amber-800 py-3">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-blue-400 rounded-full" />
                Colors
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                {availableColors.map((color) => (
                  <div key={color} className="flex items-center space-x-2">
                    <Checkbox
                      id={`color-${color}`}
                      checked={selectedColors.includes(color)}
                      onCheckedChange={() => handleColorToggle(color)}
                      className="text-amber-800 border-slate-300 data-[state=checked]:bg-amber-800 data-[state=checked]:border-amber-800"
                    />
                    <label htmlFor={`color-${color}`} className="text-sm font-medium capitalize">
                      {color}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {availableSizes.length > 0 && (
          <AccordionItem value="sizes" className="border-slate-200">
            <AccordionTrigger className="text-slate-900 hover:text-amber-800 py-3">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border border-amber-700 rounded text-xs flex items-center justify-center text-amber-700 font-bold">
                  S
                </div>
                Sizes
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <Badge
                    key={size}
                    variant={selectedSizes.includes(size) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedSizes.includes(size)
                        ? "bg-amber-800 text-white hover:bg-amber-900"
                        : "border-amber-200 text-amber-800 hover:bg-amber-50"
                    }`}
                    onClick={() => handleSizeToggle(size)}
                  >
                    {size}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {availableMaterials.length > 0 && (
          <AccordionItem value="materials" className="border-slate-200">
            <AccordionTrigger className="text-slate-900 hover:text-amber-800 py-3">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded" />
                Materials
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {availableMaterials.map((material) => (
                  <div key={material} className="flex items-center space-x-2">
                    <Checkbox
                      id={`material-${material}`}
                      checked={selectedMaterials.includes(material)}
                      onCheckedChange={() => handleMaterialToggle(material)}
                      className="text-amber-800 border-slate-300 data-[state=checked]:bg-amber-800 data-[state=checked]:border-amber-800"
                    />
                    <label htmlFor={`material-${material}`} className="text-sm font-medium capitalize">
                      {material}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {availableFeatures.length > 0 && (
          <AccordionItem value="features" className="border-slate-200">
            <AccordionTrigger className="text-slate-900 hover:text-amber-800 py-3">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-700" />
                Features
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {availableFeatures.slice(0, 10).map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature}`}
                      checked={selectedFeatures.includes(feature)}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                      className="text-amber-800 border-slate-300 data-[state=checked]:bg-amber-800 data-[state=checked]:border-amber-800"
                    />
                    <label htmlFor={`feature-${feature}`} className="text-sm font-medium">
                      {feature}
                    </label>
                  </div>
                ))}
                {availableFeatures.length > 10 && (
                  <p className="text-xs text-slate-500 mt-2">
                    +{availableFeatures.length - 10} more features available
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {availableBrands.length > 0 && (
          <AccordionItem value="brand" className="border-slate-200">
            <AccordionTrigger className="text-slate-900 hover:text-amber-800 py-3">
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-amber-700" />
                Brand
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {availableBrands.map((brand) => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={selectedBrands.includes(brand)}
                      onCheckedChange={() => handleBrandToggle(brand)}
                      className="text-amber-800 border-slate-300 data-[state=checked]:bg-amber-800 data-[state=checked]:border-amber-800"
                    />
                    <label htmlFor={`brand-${brand}`} className="text-sm font-medium">
                      {brand}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
        <Navbar />
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-amber-100 rounded-full animate-pulse" />
                <div className="w-16 h-16 border-4 border-amber-200 rounded-full animate-pulse absolute top-2 left-2" />
                <Loader2 className="h-8 w-8 text-amber-700 animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-900">Loading Products</h2>
                <p className="text-slate-600 max-w-sm">Discovering amazing items for you...</p>
                <div className="flex gap-2 justify-center">
                  <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !subcategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
        <Navbar />
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto mt-12">
            <Alert variant="destructive" className="border-red-200 bg-red-50/50 backdrop-blur-sm">
              <AlertDescription className="text-red-700 font-medium">
                {error || "Subcategory not found."}
              </AlertDescription>
            </Alert>
            <div className="mt-8 text-center">
              <Button
                asChild
                className="bg-amber-800 hover:bg-amber-900 text-white px-8 py-3 rounded-full font-medium transition-all duration-200 hover:scale-105"
              >
                <Link href="/categories">Browse All Categories</Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <Navbar />

      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
        {/* Enhanced Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-6 sm:mb-8 flex-wrap" aria-label="Breadcrumb">
          <Link
            href="/"
            className="text-slate-500 hover:text-amber-800 transition-colors duration-200 font-medium text-sm"
          >
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <Link
            href="/categories"
            className="text-slate-500 hover:text-amber-800 transition-colors duration-200 font-medium text-sm"
          >
            Categories
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <Link
            href={`/categories/${subcategory.categoryId.slug}`}
            className="text-slate-500 hover:text-amber-800 transition-colors duration-200 font-medium text-sm"
          >
            {subcategory.categoryId.title}
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-900 text-sm">{subcategory.title}</span>
        </nav>

        {/* Enhanced Hero Banner */}
        <div className="relative mb-8 sm:mb-12">
          <div className="relative h-[250px] sm:h-[350px] lg:h-[400px] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={subcategory.image || "/placeholder.svg?height=400&width=1200"}
              alt={subcategory.title}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          <div className="absolute inset-0 flex items-center">
            <div className="container px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-amber-100/90 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-4 sm:mb-6 backdrop-blur-sm">
                  <ShoppingBag className="h-4 w-4" />
                  {subcategory.categoryId.title} Collection
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight drop-shadow-lg">
                  {subcategory.title}
                </h1>

                <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 drop-shadow max-w-xl">
                  {subcategory.description}
                </p>

                {subcategory.tags && subcategory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    {subcategory.tags.slice(0, 4).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors backdrop-blur-sm px-3 py-1 text-sm"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {subcategory.tags.length > 4 && (
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1 text-sm"
                      >
                        +{subcategory.tags.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-4 bg-white p-6 rounded-xl shadow-md border border-slate-100">
              <FilterSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Filters and Product Count */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-100 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">Products</h2>
                  {!productsLoading && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-0">
                      {totalProducts} items
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="lg:hidden border-amber-200 text-amber-800 hover:bg-amber-50"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 sm:w-96 bg-white">
                      <SheetHeader className="mb-6">
                        <SheetTitle className="text-amber-800">Product Filters</SheetTitle>
                        <SheetDescription>Refine your product search</SheetDescription>
                      </SheetHeader>
                      <div className="pr-6">
                        <FilterSidebar />
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <SheetClose asChild>
                          <Button className="w-full bg-amber-800 hover:bg-amber-900 text-white">Apply Filters</Button>
                        </SheetClose>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="w-[180px] border-slate-200 focus:ring-amber-200 focus:border-amber-300">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>

                  <Tabs value={viewMode} onValueChange={setViewMode} className="hidden sm:block">
                    <TabsList className="bg-slate-100">
                      <TabsTrigger
                        value="grid"
                        className="data-[state=active]:bg-amber-800 data-[state=active]:text-white"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger
                        value="list"
                        className="data-[state=active]:bg-amber-800 data-[state=active]:text-white"
                      >
                        <List className="h-4 w-4" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="bg-white rounded-xl shadow-md border border-slate-100 p-12 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <Loader2 className="h-8 w-8 text-amber-700 animate-spin" />
                  <div>
                    <p className="font-medium text-slate-900">Loading products...</p>
                    <p className="text-sm text-slate-500">Please wait while we fetch the latest items</p>
                  </div>
                </div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div
                  className={`grid gap-4 sm:gap-6 ${
                    viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                  }`}
                >
                  {products.map((product, index) => {
                    const finalPrice = getFinalPrice(product)
                    const discountPercentage = getDiscountPercentage(product)

                    return (
                      <Card
                        key={product._id}
                        className={`overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group bg-white/90 backdrop-blur-sm hover:bg-white ${
                          viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <Link href={`/products/${product._id}`} className="block h-full">
                          <div className={viewMode === "list" ? "flex flex-col sm:flex-row h-full" : ""}>
                            <CardHeader
                              className={`p-0 relative ${viewMode === "list" ? "sm:w-80 sm:flex-shrink-0" : ""}`}
                            >
                              <div
                                className={`relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 ${
                                  viewMode === "list" ? "aspect-[16/10] sm:aspect-[4/3]" : "aspect-square"
                                }`}
                              >
                                <Image
                                  src={product.images?.[0] || "/placeholder.svg?height=300&width=300"}
                                  alt={product.title}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />

                                {discountPercentage > 0 && (
                                  <Badge className="absolute top-3 left-3 bg-amber-600 text-white font-medium px-2 py-1 text-xs">
                                    {discountPercentage}% OFF
                                  </Badge>
                                )}

                                {product.stockQuantity === 0 && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                    <Badge
                                      variant="secondary"
                                      className="bg-white/80 text-slate-900 text-sm px-3 py-1.5"
                                    >
                                      Out of Stock
                                    </Badge>
                                  </div>
                                )}

                                {/* Quick action buttons */}
                                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                                    <Heart className="h-4 w-4 text-amber-800" />
                                  </div>
                                  <div className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                                    <Eye className="h-4 w-4 text-amber-800" />
                                  </div>
                                </div>

                                {/* "New" badge for recent products */}
                                {product.createdAt &&
                                  new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                                    <Badge className="absolute bottom-3 left-3 bg-emerald-600 text-white font-medium px-2 py-1 text-xs">
                                      NEW
                                    </Badge>
                                  )}
                              </div>

                              {viewMode === "list" && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 sm:hidden">
                                  <h3 className="font-bold text-lg text-white group-hover:text-amber-200 transition-colors duration-300 drop-shadow-lg">
                                    {product.title}
                                  </h3>
                                </div>
                              )}
                            </CardHeader>

                            <CardContent
                              className={`p-4 sm:p-6 ${viewMode === "list" ? "flex-1 flex flex-col justify-between" : ""}`}
                            >
                              {viewMode === "list" && (
                                <div className="mb-4 sm:mb-0 hidden sm:block">
                                  <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-amber-800 transition-colors duration-300">
                                    {product.title}
                                  </h3>
                                </div>
                              )}

                              {viewMode !== "list" && (
                                <h3 className="font-bold text-lg text-slate-900 line-clamp-2 mb-2 group-hover:text-amber-800 transition-colors">
                                  {product.title}
                                </h3>
                              )}

                              <p className="text-slate-600 text-sm line-clamp-2 mb-3 leading-relaxed">
                                {product.shortDescription}
                              </p>

                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg text-slate-900">
                                    NPR {finalPrice.toLocaleString()}
                                  </span>
                                  {product.discountPrice && product.originalPrice && (
                                    <span className="text-slate-500 line-through text-sm">
                                      NPR {product.originalPrice.toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                {product.colors && product.colors.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {product.colors.slice(0, 3).map((color) => (
                                      <Badge
                                        key={color}
                                        variant="outline"
                                        className="text-xs border-slate-200 text-slate-600"
                                      >
                                        {color}
                                      </Badge>
                                    ))}
                                    {product.colors.length > 3 && (
                                      <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
                                        +{product.colors.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                {product.sizes && product.sizes.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {product.sizes.slice(0, 4).map((size) => (
                                      <Badge
                                        key={size}
                                        variant="outline"
                                        className="text-xs border-slate-200 text-slate-600"
                                      >
                                        {size}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {product.material && (
                                  <p className="text-xs text-slate-500 mb-1">Material: {product.material}</p>
                                )}

                                {product.warranty && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Check className="h-3 w-3 text-green-600" />
                                    <span className="text-xs text-green-600">Warranty Available</span>
                                  </div>
                                )}

                                {product.isCashOnDeliveryAvailable && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Check className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs text-blue-600">Cash on Delivery</span>
                                  </div>
                                )}

                                {product.brand && (
                                  <Badge variant="outline" className="border-slate-200 text-slate-600 font-normal">
                                    {product.brand}
                                  </Badge>
                                )}

                                {product.rating && (
                                  <div className="flex items-center gap-1">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < Math.floor(product.rating!)
                                              ? "fill-amber-400 text-amber-400"
                                              : "text-slate-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-slate-600">({product.reviewsCount || 0})</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>

                            <CardFooter
                              className={`p-4 pt-0 sm:p-6 sm:pt-0 ${viewMode === "list" ? "sm:border-t sm:border-slate-100 sm:mt-auto" : ""}`}
                            >
                              <div className="w-full flex items-center justify-between">
                                <div className="flex items-center text-amber-800 font-medium text-sm group-hover:text-amber-900 transition-colors">
                                  View Details
                                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>

                                <Button
                                  size="sm"
                                  className="bg-amber-800 hover:bg-amber-900 text-white rounded-full w-8 h-8 p-0"
                                  disabled={product.stockQuantity === 0}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                  <span className="sr-only">Add to cart</span>
                                </Button>
                              </div>
                            </CardFooter>
                          </div>
                        </Link>
                      </Card>
                    )
                  })}
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8 sm:mt-12">
                    <div className="bg-white rounded-full shadow-md border border-slate-100 p-1 flex items-center">
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-full"
                      >
                        Previous
                      </Button>

                      <div className="flex items-center px-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Logic to show current page and surrounding pages
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <Button
                              key={i}
                              variant={currentPage === pageNum ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 p-0 mx-0.5 rounded-full ${
                                currentPage === pageNum
                                  ? "bg-amber-800 text-white"
                                  : "text-slate-600 hover:text-amber-800 hover:bg-amber-50"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>

                      <Button
                        variant="ghost"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-full"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-slate-100 p-12 text-center">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="h-10 w-10 text-amber-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Products Found</h3>
                  <p className="text-slate-600 mb-6 max-w-md">
                    {searchQuery || activeFilters.length > 0
                      ? "No products match your current filters. Try adjusting your search criteria."
                      : `No products found in the ${subcategory.title} subcategory yet.`}
                  </p>

                  {searchQuery || activeFilters.length > 0 ? (
                    <Button
                      onClick={clearFilters}
                      className="bg-amber-800 hover:bg-amber-900 text-white px-6 py-2 rounded-full"
                    >
                      Clear All Filters
                    </Button>
                  ) : (
                    <Button asChild className="bg-amber-800 hover:bg-amber-900 text-white px-6 py-2 rounded-full">
                      <Link href={`/categories/${subcategory.categoryId.slug}`}>
                        View All {subcategory.categoryId.title}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced About Section */}
        <div className="mt-12 sm:mt-16 bg-white rounded-xl shadow-md border border-slate-100 p-6 sm:p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                <ShoppingBag className="h-4 w-4 text-amber-800" />
              </span>
              About {subcategory.title}
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed">{subcategory.description}</p>

              {subcategory.tags && subcategory.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Popular Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {subcategory.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-amber-50 text-amber-800 hover:bg-amber-100">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Browse our collection of premium {subcategory.title} products. We offer high-quality items with fast
                  shipping and excellent customer service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
