# Shop On Clique - SEO Optimization Guide

## Overview
This guide outlines the comprehensive SEO implementation for Shop On Clique, a premium fashion and lifestyle e-commerce store in Nepal.

## 🎯 SEO Strategy

### Target Keywords (Nepali E-commerce Focus)
- **Primary Keywords:**
  - "online shopping Nepal"
  - "fashion store Nepal"
  - "clothing Nepal"
  - "eSewa payment"
  - "free shipping Nepal"

- **Secondary Keywords:**
  - "premium fashion"
  - "trending clothes"
  - "accessories Nepal"
  - "cash on delivery Nepal"
  - "secure shopping"

### Local SEO Focus
- **Geographic Targeting:** Nepal, Kathmandu, major cities
- **Local Business Schema:** Complete business information
- **Payment Methods:** eSewa, cash on delivery, cards
- **Currency:** NPR (Nepalese Rupee)

## 🏗️ Technical SEO Implementation

### 1. Meta Tags & Structured Data
- **Organization Schema:** Complete business information
- **Local Business Schema:** Address, hours, payment methods
- **Product Schema:** Rich snippets for products
- **Breadcrumb Schema:** Navigation structure
- **FAQ Schema:** Common questions and answers

### 2. Performance Optimization
- **Font Optimization:** Preconnect to Google Fonts
- **Image Optimization:** Next.js Image component
- **DNS Prefetch:** External resources
- **PWA Support:** Manifest.json for mobile experience

### 3. Crawlability & Indexing
- **Robots.txt:** Dynamic generation with proper directives
- **Sitemap.xml:** Dynamic sitemap with all important pages
- **Canonical URLs:** Prevent duplicate content
- **Meta Robots:** Proper indexing instructions

## 📱 Mobile-First SEO

### PWA Features
- **App-like Experience:** Standalone display mode
- **Offline Support:** Service worker ready
- **Fast Loading:** Optimized assets
- **Install Prompt:** Add to home screen

### Mobile Optimization
- **Responsive Design:** All screen sizes
- **Touch-friendly:** Proper button sizes
- **Fast Loading:** Optimized for mobile networks
- **Local Search:** GPS integration ready

## 🛒 E-commerce SEO Best Practices

### Product Pages
- **Rich Product Data:** Complete product information
- **Customer Reviews:** Aggregate rating schema
- **Availability Status:** In-stock/out-of-stock indicators
- **Pricing Information:** Current and original prices
- **Shipping Details:** Free shipping thresholds

### Category Pages
- **Category Descriptions:** Unique, informative content
- **Product Counts:** Number of items in category
- **Filter Options:** Size, color, price filters
- **Sorting Options:** Relevance, price, popularity

### Shopping Cart & Checkout
- **Abandoned Cart Recovery:** Email triggers
- **Secure Checkout:** SSL certificates
- **Multiple Payment Options:** eSewa, cards, COD
- **Order Tracking:** Real-time updates

## 🔍 Content SEO Strategy

### Homepage Optimization
- **Hero Section:** Clear value proposition
- **Trust Signals:** Security badges, reviews
- **Featured Products:** Handpicked collections
- **Category Showcase:** Easy navigation
- **Newsletter Signup:** Lead generation

### Content Types
- **Product Descriptions:** Detailed, keyword-rich
- **Category Pages:** Informative category guides
- **Blog Content:** Fashion tips, trends
- **FAQ Pages:** Common customer questions
- **About Us:** Company story and values

## 📊 Analytics & Tracking

### Google Analytics 4
- **Enhanced E-commerce:** Product performance tracking
- **Conversion Tracking:** Sales and goals
- **User Behavior:** Page views, time on site
- **Traffic Sources:** Organic, paid, social

### Facebook Pixel
- **Conversion Tracking:** Purchase events
- **Audience Building:** Custom audiences
- **Retargeting:** Abandoned cart campaigns
- **Lookalike Audiences:** Similar customer targeting

## 🚀 Performance Metrics

### Core Web Vitals
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### SEO Metrics
- **Page Speed:** 90+ PageSpeed Insights score
- **Mobile Usability:** 100% mobile-friendly
- **Core Web Vitals:** All metrics in green
- **Accessibility:** WCAG 2.1 AA compliant

## 📈 Local SEO Strategy

### Google My Business
- **Complete Profile:** Photos, hours, services
- **Customer Reviews:** Encourage positive reviews
- **Local Posts:** Updates and offers
- **Q&A Section:** Customer questions

### Local Citations
- **Business Directories:** Nepal-specific listings
- **Social Media:** Facebook, Instagram, TikTok
- **Review Sites:** Google, Facebook, local platforms
- **Industry Directories:** Fashion and retail

## 🔧 Technical Implementation

### Next.js SEO Features
- **Metadata API:** Dynamic meta tags
- **Structured Data:** JSON-LD implementation
- **Image Optimization:** Automatic optimization
- **Static Generation:** Fast loading pages

### Performance Optimizations
- **Code Splitting:** Automatic bundle optimization
- **Lazy Loading:** Images and components
- **Caching:** Static and dynamic caching
- **CDN:** Global content delivery

## 📱 Social Media SEO

### Open Graph Tags
- **Facebook Sharing:** Rich previews
- **Twitter Cards:** Optimized for Twitter
- **LinkedIn Sharing:** Professional appearance
- **WhatsApp Sharing:** Mobile-friendly previews

### Social Media Strategy
- **Platform-specific Content:** Tailored for each platform
- **Hashtag Strategy:** Trending and relevant hashtags
- **User-generated Content:** Customer photos and reviews
- **Influencer Partnerships:** Fashion influencers in Nepal

## 🎯 Conversion Optimization

### Trust Signals
- **Security Badges:** SSL, secure payment
- **Customer Reviews:** Real testimonials
- **Social Proof:** User counts, sales numbers
- **Money-back Guarantee:** Risk-free shopping

### User Experience
- **Easy Navigation:** Clear menu structure
- **Search Functionality:** Product search with filters
- **Quick Checkout:** Streamlined process
- **Mobile Optimization:** Touch-friendly interface

## 📊 Monitoring & Maintenance

### Regular Audits
- **Technical SEO:** Monthly technical audits
- **Content Quality:** Quarterly content reviews
- **Performance Monitoring:** Weekly performance checks
- **Competitor Analysis:** Monthly competitor tracking

### Updates & Improvements
- **Algorithm Updates:** Stay current with Google updates
- **Feature Additions:** New SEO features as needed
- **Performance Optimization:** Continuous improvement
- **User Feedback:** Incorporate customer suggestions

## 🎉 Success Metrics

### Traffic Goals
- **Organic Traffic:** 50% increase in 6 months
- **Local Traffic:** 30% from Nepal searches
- **Mobile Traffic:** 70% mobile users
- **Conversion Rate:** 3%+ e-commerce conversion

### Ranking Goals
- **Primary Keywords:** Top 3 positions
- **Local Keywords:** Top 5 positions
- **Long-tail Keywords:** Top 10 positions
- **Featured Snippets:** 5+ featured snippets

This comprehensive SEO strategy positions Shop On Clique as the leading fashion e-commerce destination in Nepal, with strong local presence and excellent user experience. 

## **Root Cause:**
The `www` subdomain is not properly configured in your nginx setup. Looking at your nginx configuration, you have:

```nginx
<code_block_to_apply_changes_from>
```

But the `www` subdomain might not be properly handling the API routes.

## **The Problem:**
When someone visits `https://www.shoponclique.com/`, the frontend loads but the API calls are likely going to the wrong endpoint or not being routed correctly.

## **Solution:**

You need to ensure that **both domains** (`shoponclique.com` and `www.shoponclique.com`) are properly configured to handle API routes. Here's what to check on your VPS:

### **1. Check if both domains are enabled:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

### **2. Verify your nginx configuration includes both domains:**
Make sure your `/etc/nginx/sites-available/shoponclique` file has:
```nginx
server_name shoponclique.com www.shoponclique.com;
```

### **3. Check if the site is enabled:**
```bash
sudo ln -s /etc/nginx/sites-available/shoponclique /etc/nginx/sites-enabled/
```

### **4. Test the API endpoints directly:**
On your VPS, test if the API works on both domains:
```bash
# Test without www
curl -I https://shoponclique.com/api/public/products

# Test with www
curl -I https://www.shoponclique.com/api/public/products
```

### **5. Check browser console errors:**
Open the browser developer tools on `https://www.shoponclique.com/` and check the Console tab for any API errors.

## **Most Likely Fix:**
The issue is probably that your frontend is making API calls to the wrong domain. Check your frontend environment variables to ensure the API URL is configured correctly for both domains.

Can you check your VPS and run these commands to diagnose the exact issue? 