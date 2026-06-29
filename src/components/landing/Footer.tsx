"use client";

import { useState } from "react";
import {
  BookOpen,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Lock,
  Ban,
} from "lucide-react";
import { Button } from "../ui/button";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setEmail("");
        setMessage("");
        
        // Reset success message after 3 seconds
        setTimeout(() => setSubmitStatus("idle"), 3000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerSections = [
    // {
    //   title: "Product",
    //   links: [
    //     { label: "Features", href: "#features" },
    //     { label: "How It Works", href: "#how-it-works" },
    //   ],
    // },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Contact Us", href: "/contact" },
        { label: "Pricing", href: "#pricing" },

      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Refund Policy", href: "/refund" },
      ],
    },
  ];

  const socialLinks = [
    { icon: FacebookIcon, href: "#facebook", label: "Facebook" },
    { icon: InstagramIcon, href: "#instagram", label: "Instagram" },
  ];

  const contactInfo = [
    { icon: Mail, text: "lexopiaapp@gmail.com" },
  ];

  return (
    <footer className="relative bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 pt-16 pb-8">
      <div className="relative max-w-7xl mx-auto px-6 md:px-8">
        {/* Top Section: Branding + Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 pb-16 border-b border-slate-700/50">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-2xl font-semibold text-white">Lexopia</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
              Transforming young readers into confident learners through
              interactive stories and intelligent riddle challenges.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{info.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Form Section */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Talk with us</h4>
            <p className="text-slate-400 text-sm mb-4">
              Have questions? We'd love to hear from you. Send us a message!
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-sm"
                required
              />
              <textarea
                placeholder="Your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-sm resize-none"
                required
              />
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
              {submitStatus === "success" && (
                <p className="text-xs text-green-400 mt-2">
                  Message sent successfully!
                </p>
              )}
              {submitStatus === "error" && (
                <p className="text-xs text-red-400 mt-2">
                  Failed to send message. Please try again.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Middle Section: Links */}
        <div className="grid grid-cols-2 gap-8 mb-16 pb-16 border-b border-slate-700/50">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-primary transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section: Social + Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 font-medium">
              Follow us:
            </span>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-primary hover:bg-slate-700/50 transition-all duration-300 hover:scale-110"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-xs md:text-sm text-slate-500">
              <span className="text-primary">{currentYear} Lexopia</span>. All
              rights reserved.
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-12 border-t border-slate-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <p className="text-xs text-slate-500 mb-1">
                {" "}
                <ShieldCheck size={20} />
              </p>
              <p className="text-xs text-slate-500">Child Safety First</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs text-slate-500 mb-1">
                {" "}
                <Lock size={20} />
              </p>
              <p className="text-xs text-slate-500">Data Secured</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs text-slate-500 mb-1">
                <ShieldCheck size={20} />
              </p>
              <p className="text-xs text-slate-500">Privacy Protected</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs text-slate-500 mb-1">
                {" "}
                <Ban size={20} />
              </p>
              <p className="text-xs text-slate-500">Ad-Free</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
