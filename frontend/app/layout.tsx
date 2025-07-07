import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { Cormorant_Garamond, Inter } from "next/font/google"
import { Toaster } from '@/components/ui/toaster'
import { CartProvider } from './context/CartContext'
import Script from 'next/script'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: 'Shop On Clique - Premium Fashion & Lifestyle Store | Nepal',
    template: '%s | Shop On Clique'
  },
  description: 'Discover the latest fashion trends, premium clothing, accessories, and lifestyle products at Shop On Clique. Free shipping on orders over NPR 2000. Secure payments with eSewa, cards & cash on delivery. Fast delivery across Nepal.',
  keywords: [
    'online shopping Nepal',
    'fashion store Nepal',
    'clothing Nepal',
    'eSewa payment',
    'free shipping Nepal',
    'premium fashion',
    'trending clothes',
    'accessories Nepal',
    'lifestyle products',
    'cash on delivery Nepal',
    'secure shopping',
    'fast delivery Nepal',
    'fashion trends 2025',
    'online store Nepal',
    'premium brands Nepal'
  ],
  authors: [{ name: 'Shop On Clique' }],
  creator: 'Synexis Softech',
  publisher: 'Shop On Clique',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://shoponclique.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://shoponclique.com',
    siteName: 'Shop On Clique',
    title: 'Shop On Clique - Premium Fashion & Lifestyle Store | Nepal',
    description: 'Discover the latest fashion trends, premium clothing, accessories, and lifestyle products. Free shipping on orders over NPR 2000. Secure payments with eSewa, cards & cash on delivery.',
    images: [
      {
        url: '/logo/logo.png',
        width: 1200,
        height: 630,
        alt: 'Shop On Clique - Premium Fashion Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop On Clique - Premium Fashion & Lifestyle Store | Nepal',
    description: 'Discover the latest fashion trends, premium clothing, accessories, and lifestyle products. Free shipping on orders over NPR 2000.',
    images: ['/logo/logo.png'],
    creator: '@shoponclique',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'e-commerce',
  classification: 'Fashion & Lifestyle',
  other: {
    'geo.region': 'NP',
    'geo.placename': 'Nepal',
    'geo.position': '27.7172;85.3240',
    'ICBM': '27.7172, 85.3240',
    'DC.title': 'Shop On Clique - Premium Fashion & Lifestyle Store',
    'DC.creator': 'Shop On Clique',
    'DC.subject': 'Fashion, Clothing, Accessories, Lifestyle',
    'DC.description': 'Premium fashion and lifestyle products with free shipping across Nepal',
    'DC.publisher': 'Shop On Clique',
    'DC.contributor': 'Synexis Softech',
    'DC.date': '2025',
    'DC.type': 'Text',
    'DC.format': 'text/html',
    'DC.identifier': 'https://shoponclique.com',
    'DC.language': 'en',
    'DC.coverage': 'Nepal',
    'DC.rights': 'Copyright 2025 Shop On Clique',
  },
}

// Structured Data for Organization
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Shop On Clique",
  "url": "https://shoponclique.com",
  "logo": "https://shoponclique.com/logo/logo.png",
  "description": "Premium fashion and lifestyle store offering the latest trends with free shipping across Nepal",
  "foundingDate": "2025",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "NP",
    "addressRegion": "Kathmandu",
    "addressLocality": "Kathmandu"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+977-1-1234567",
    "contactType": "customer service",
    "availableLanguage": ["English", "Nepali"]
  },
  "sameAs": [
    "https://facebook.com/shoponclique",
    "https://instagram.com/shoponclique",
    "https://tiktok.com/@shoponclique"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Fashion & Lifestyle Products",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": "Premium Clothing"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": "Accessories"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": "Lifestyle Products"
        }
      }
    ]
  }
}

// Structured Data for WebSite
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Shop On Clique",
  "url": "https://shoponclique.com",
  "description": "Premium fashion and lifestyle store in Nepal",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://shoponclique.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}

// Structured Data for Local Business
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Shop On Clique",
  "image": "https://shoponclique.com/logo/logo.png",
  "description": "Premium fashion and lifestyle store offering the latest trends with free shipping across Nepal",
  "url": "https://shoponclique.com",
  "telephone": "+977-1-1234567",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Fashion Street",
    "addressLocality": "Kathmandu",
    "addressRegion": "Bagmati",
    "postalCode": "44600",
    "addressCountry": "NP"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 27.7172,
    "longitude": 85.3240
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday", 
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ],
    "opens": "09:00",
    "closes": "18:00"
  },
  "priceRange": "$$",
  "paymentAccepted": ["Cash", "Credit Card", "eSewa", "Digital Wallet"],
  "currenciesAccepted": "NPR"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${inter.variable}`}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo/logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo/logo.png" />
        
        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
        
        {/* Facebook Pixel */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', 'YOUR_FACEBOOK_PIXEL_ID');
            fbq('track', 'PageView');
          `}
        </Script>
      </body>
    </html>
  )
}
