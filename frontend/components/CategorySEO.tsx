import Script from 'next/script'

interface CategorySEOProps {
  category: {
    name: string
    description: string
    image?: string
    productCount: number
    subcategories?: Array<{
      name: string
      productCount: number
    }>
  }
}

export default function CategorySEO({ category }: CategorySEOProps) {
  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category.name} - Shop On Clique`,
    "description": category.description,
    "url": `https://shoponclique.com/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`,
    "image": category.image || "https://shoponclique.com/logo/logo.png",
    "mainEntity": {
      "@type": "ItemList",
      "name": `${category.name} Products`,
      "numberOfItems": category.productCount,
      "description": `Browse our collection of ${category.name.toLowerCase()} products`
    },
    "breadcrumb": {
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
          "name": category.name,
          "item": `https://shoponclique.com/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`
        }
      ]
    }
  }

  // FAQ Schema for Category Page
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What are the best ${category.name.toLowerCase()} products?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Discover our curated collection of premium ${category.name.toLowerCase()} products. We offer high-quality items with the latest trends and styles.`
        }
      },
      {
        "@type": "Question",
        "name": `How do I choose the right ${category.name.toLowerCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Consider your style preferences, size requirements, and budget. Our product descriptions and customer reviews can help you make the best choice."
        }
      },
      {
        "@type": "Question",
        "name": "Do you offer free shipping on this category?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We offer free shipping on all orders over NPR 2000 across Nepal."
        }
      }
    ]
  }

  return (
    <>
      <Script
        id="category-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(categorySchema),
        }}
      />
      <Script
        id="category-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
    </>
  )
} 