"use client";

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

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Pricing", href: "#pricing" },
        { label: "For Educators", href: "#educators" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "Press", href: "/press" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Safety Guide", href: "/safety" },
        { label: "Educator Guide", href: "/educator-guide" },
        { label: "Parent Resources", href: "/parent-resources" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
  ];

  // const socialLinks = [
  //   { icon: Facebook, href: "#facebook", label: "Facebook" },
  //   { icon: Twitter, href: "#twitter", label: "Twitter" },
  //   { icon: Instagram, href: "#instagram", label: "Instagram" },
  //   { icon: Linkedin, href: "#linkedin", label: "LinkedIn" },
  // ];

  const contactInfo = [
    { icon: MapPin, text: "123 Learning Street, Education City, EC 12345" },
    { icon: Phone, text: "+1 (555) 123-4567" },
    { icon: Mail, text: "hello@Lexopia.com" },
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

          {/* Newsletter Section */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Stay Updated</h4>
            <p className="text-slate-400 text-sm mb-4">
              Get the latest updates, reading tips, and exclusive educator
              resources delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <Button>Subscribe</Button>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>

        {/* Middle Section: Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 pb-16 border-b border-slate-700/50">
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
            {/* <div className="flex gap-3">
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
            </div> */}
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
