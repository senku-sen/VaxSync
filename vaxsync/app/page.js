"use client"

import { useState } from "react"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import Tutorial from "@/components/landing/tutorial"
import CTA from "@/components/landing/cta"
import Navigation from "@/components/landing/navigation"

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

      <section id="hero">
        <Hero onGetStarted={() => setShowAuth(true)} />
      </section>

      <section id="features" className="pt-5">
        <Features />
      </section>

      <section id="tutorial" className="pt-5">
        <Tutorial />
      </section>

      <section id="about" className="pt-5">
        <CTA onGetStarted={() => setShowAuth(true)} />
      </section>
    </main>
  )
}
