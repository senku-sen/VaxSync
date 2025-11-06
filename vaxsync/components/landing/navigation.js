"use client"

export default function Navigation({ onGetStarted }) {
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="RHU 1 Logo" className="w-10 h-12 square-full" />
          <span className="font-bold text-xl text-foreground">VaxSync</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-foreground/70 hover:text-foreground transition">
            Features
          </a>
          <a href="#tutorial" className="text-foreground/70 hover:text-foreground transition">
            Tutorial
          </a>
          <a href="#about" className="text-foreground/70 hover:text-foreground transition">
            About
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onGetStarted}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
          
            Get Started
          </button>
        </div>
      </div>
    </nav>
  )
}
