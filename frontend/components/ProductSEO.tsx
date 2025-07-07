import Script from 'next/script'

interface ProductSEOProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number
    images: string[]
    category: string
    subcategory?: string
    brand?: string
    rating?: number
    reviewCount?: number
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
    sku?: string
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
  }
}

export default function ProductSEO({ product }: ProductSEOProps) {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Shop On Clique"
    },
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "url": `https://shoponclique.com/products/${product.id}`,
      "priceCurrency": "NPR",
      "price": product.price,
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": `https://schema.org/${product.availability || 'InStock'}`,
      "seller": {
        "@type": "Organization",
        "name": "Shop On Clique"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 0,
          "currency": "NPR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          }
        }
      }
    },
    "aggregateRating": product.rating && product.reviewCount ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount,
      "bestRating": 5,
      "worstRating": 1
    } : undefined,
    "review": product.rating && product.reviewCount ? {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": product.rating,
        "bestRating": 5
      },
      "author": {
        "@type": "Person",
        "name": "Shop On Clique Customer"
      }
    } : undefined,
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Category",
        "value": product.category
      },
      ...(product.subcategory ? [{
        "@type": "PropertyValue",
        "name": "Subcategory",
        "value": product.subcategory
      }] : []),
      ...(product.weight ? [{
        "@type": "PropertyValue",
        "name": "Weight",
        "value": `${product.weight}g`
      }] : []),
      ...(product.dimensions ? [{
        "@type": "PropertyValue",
        "name": "Dimensions",
        "value": `${product.dimensions.length}x${product.dimensions.width}x${product.dimensions.height}cm`
      }] : [])
    ]
  }

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shoponclique.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Categories",
        "item": "https://shoponclique.com/categories"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.category,
        "item": `https://shoponclique.com/categories/${product.category.toLowerCase().replace(/\s+/g, '-')}`
      },
      ...(product.subcategory ? [{
        "@type": "ListItem",
        "position": 4,
        "name": product.subcategory,
        "item": `https://shoponclique.com/categories/${product.category.toLowerCase().replace(/\s+/g, '-')}/${product.subcategory.toLowerCase().replace(/\s+/g, '-')}`
      }] : []),
      {
        "@type": "ListItem",
        "position": product.subcategory ? 5 : 4,
        "name": product.name,
        "item": `https://shoponclique.com/products/${product.id}`
      }
    ]
  }

  return (
    <>
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  )
} 