"use client"

import Link from "next/link"
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Heart,
  ArrowRight,
  Youtube,
  Github,
  Globe,
  MessageCircle,
} from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { publicSocialLinkService, type PublicSocialLink } from "../../../../service/public/publicSocialLink"

// Icon mapping for different social platforms
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
    github: Github,
    globe: Globe,
    web: Globe,
    website: Globe,
    whatsapp: MessageCircle,
    telegram: MessageCircle,
  }

  const normalizedIcon = iconName.toLowerCase().trim()
  return iconMap[normalizedIcon] || Globe // Default to Globe icon
}

// Helper function to check if a string is a valid URL for an image
const isImageUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url) || url.startsWith("data:image/") || url.startsWith("http")
}

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [socialLinks, setSocialLinks] = useState<PublicSocialLink[]>([])
  const [isLoadingSocial, setIsLoadingSocial] = useState(true)
  const [socialError, setSocialError] = useState<string | null>(null)

  // Fetch social links on component mount
  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        setIsLoadingSocial(true)
        setSocialError(null)
        const links = await publicSocialLinkService.getAllPublic()
        console.log("Fetched social links:", links) // Debug log
        setSocialLinks(links)
      } catch (error: any) {
        console.error("Failed to load social links:", error)
        setSocialError(error.message)
        // Fallback to default social links if API fails
        setSocialLinks([
          { _id: "1", title: "Facebook", link: "#", icon: "facebook" },
          { _id: "2", title: "Instagram", link: "#", icon: "instagram" },
          { _id: "3", title: "Twitter", link: "#", icon: "twitter" },
          { _id: "4", title: "LinkedIn", link: "#", icon: "linkedin" },
        ])
      } finally {
        setIsLoadingSocial(false)
      }
    }

    fetchSocialLinks()
  }, [])

  return (
    <footer className="bg-gradient-to-br from-[#8B6F47] via-[#7A5F42] to-[#6B5139] text-gray-300 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-10 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <Link href="/" className="inline-block group">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 flex items-center justify-center transition-transform duration-300">
                  <Image src="/logo/logo.png" width={32} height={32} alt="Logo" className="object-contain" />
                </div>
                <span className="text-white text-xl font-cormorant font-medium italic">Shop On Clique</span>
              </div>
            </Link>
            <p className="text-amber-100 max-w-xs font-cormorant italic text-base leading-relaxed">
              Discover the latest fashion trends and elevate your style with our curated collections.
            </p>

            {/* Dynamic Social Links */}
            <div className="space-y-3">
              <h4 className="text-white font-cormorant font-medium text-lg">Follow Us</h4>

              {isLoadingSocial ? (
                // Loading skeleton for social icons
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
                      <div className="h-4 bg-white/10 rounded animate-pulse flex-1 max-w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {socialLinks.map((social, index) => {
                    const IconComponent = getIconComponent(social.icon)
                    const isCustomIcon = isImageUrl(social.icon)

                    return (
                      <motion.div
                        key={social._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                        className="flex items-center space-x-3 group"
                      >
                        <a
                          href={social.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 text-amber-100 hover:text-white transition-all duration-300 group"
                          title={social.description || social.title}
                        >
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-orange-500 transition-all duration-300 group-hover:scale-110 shadow-lg">
                            {isCustomIcon ? (
                              <Image
                                src={social.icon || "/placeholder.svg"}
                                alt={social.title}
                                width={20}
                                height={20}
                                className="object-contain"
                              />
                            ) : (
                              <IconComponent className="h-5 w-5" />
                            )}
                          </div>
                          <span className="font-cormorant text-base group-hover:text-white transition-colors duration-300">
                            {social.title}
                          </span>
                        </a>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Show error message if social links failed to load */}
              {socialError && (
                <p className="text-red-300 text-xs italic">Note: Using default social links due to loading error</p>
              )}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="text-white font-cormorant font-medium italic text-xl mb-4 relative">
              Quick Links
              <div className="absolute bottom-0 left-0 w-10 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
            </h3>
            <ul className="space-y-2">
              {[
                { name: "Home", href: "/" },
                { name: "Shop", href: "/shop" },
                { name: "New Arrivals", href: "/new-arrivals" },
      
                { name: "About Us", href: "/about" },
                { name: "Contact", href: "/contact" },
              ].map((link, index) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="font-cormorant text-amber-100 hover:text-white transition-colors duration-300 flex items-center group text-base"
                  >
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Help & Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-white font-cormorant font-medium italic text-xl mb-4 relative">
              Help & Support
              <div className="absolute bottom-0 left-0 w-10 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
            </h3>
            <ul className="space-y-2">
              {[
                { name: "FAQ", href: "/faq" },
                { name: "Shipping Info", href: "/shipping" },
                { name: "Returns", href: "/returns" },
            
                
                { name: "Privacy Policy", href: "/privacy-policy" },
                { name: "Terms", href: "/terms" },
              ].map((link, index) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="font-cormorant text-amber-100 hover:text-white transition-colors duration-300 flex items-center group text-base"
                  >
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-white font-cormorant font-medium italic text-xl mb-4 relative">
              Contact Us
              <div className="absolute bottom-0 left-0 w-10 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 group">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-amber-400/30 group-hover:to-orange-500/30 transition-all duration-300">
                  <MapPin className="h-4 w-4 text-amber-200" />
                </div>
                <span className="font-cormorant text-amber-100 text-base leading-relaxed">
                  123 Fashion Street, NY 10001
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-amber-400/30 group-hover:to-orange-500/30 transition-all duration-300">
                  <Phone className="h-4 w-4 text-amber-200" />
                </div>
                <a
                  href="tel:+1-555-123-4567"
                  className="font-cormorant text-amber-100 text-base hover:text-white transition-colors"
                >
                  +1 (555) 123-4567
                </a>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-amber-400/30 group-hover:to-orange-500/30 transition-all duration-300">
                  <Mail className="h-4 w-4 text-amber-200" />
                </div>
                <a
                  href="mailto:support@shoponclique.com"
                  className="font-cormorant text-amber-100 text-base hover:text-white transition-colors"
                >
                  support@shoponclique.com
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 pt-4 border-t border-white/20"
        >
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <p className="font-cormorant text-amber-100 text-base mb-2 md:mb-0">
              © {currentYear} Shop On Clique. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 font-cormorant italic text-amber-200 text-sm">
              <span>Designed </span>
              <Heart className="w-4 h-4 text-red-400 animate-pulse" />
              <span> By Synexis Softech</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
