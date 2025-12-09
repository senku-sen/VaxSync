"use client"

import { useRouter } from "next/navigation"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import Tutorial from "@/components/landing/tutorial"
import CTA from "@/components/landing/cta"
import Navigation from "@/components/landing/navigation"

export default function Home() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/pages/signin')
  }

  // Add smooth scroll behavior to html element
  if (typeof window !== 'undefined') {
    document.documentElement.style.scrollBehavior = 'smooth'
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation onGetStarted={handleGetStarted} />

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
