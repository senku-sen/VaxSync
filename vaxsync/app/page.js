"use client"

import { useState } from "react"
import Hero from "@/components/hero"
import Features from "@/components/features"
import Tutorial from "@/components/tutorial"
import CTA from "@/components/cta"
import Navigation from "@/components/navigation"

export default function Home() {
  const [showAuth, setShowAuth] = useState(false)

  if (showAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Authentication Coming Soon</h1>
          <button
            onClick={() => setShowAuth(false)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation onGetStarted={() => setShowAuth(true)} />
      <Hero onGetStarted={() => setShowAuth(true)} />
      <Features />
      <Tutorial />
      <CTA onGetStarted={() => setShowAuth(true)} />
    </main>
  )
}
