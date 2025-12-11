"use client";

import Link from "next/link";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import Tutorial from "@/components/landing/tutorial";
import CTA from "@/components/landing/cta";

export default function Navigation({ onGetStarted }) {
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="RHU 1 Logo" className="w-10 h-12 square-full" />
          <span className="font-bold text-xl text-foreground">VaxSync</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#hero" className="text-foreground/70 hover:text-foreground transition cursor-pointer">
            Home  
          </a>
          <a href="#features" className="text-foreground/70 hover:text-foreground transition cursor-pointer">
            Features
          </a>
          <a href="#rhu-info" className="text-foreground/70 hover:text-foreground transition cursor-pointer">
            RHU1
          </a>
          <a href="#about" className="text-foreground/70 hover:text-foreground transition cursor-pointer">
            About
          </a>
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGetStarted}
            className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-primary-foreground font-medium hover:opacity-90 transition">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
