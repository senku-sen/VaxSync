"use client"

import Image from "next/image"

export default function Hero({ onGetStarted }) {
  return (
    <section className="relative overflow-hidden pt-20 pb-32 md:pt-40 md:pb-48 bg-white">
      {/* Background subtle blur circles (optional, can remove if you want full plain white) */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight text-balance">
              Vaccine Inventory Management
            </h1>
            <p className="text-xl text-foreground/60 leading-relaxed text-pretty">
              Reliable Data. Timely Vaccines. Health for All.
            </p>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-2xl font-bold text-foreground">99.9%</p>
                <p className="text-sm text-foreground/60">Uptime</p>
              </div>
            </div>
          </div>

          {/* Right visual — large VaxSync logo */}
          <div className="flex justify-center md:justify-end">
            <Image
              src="/image1.png"  // file in public folder
              alt="VaxSync logo"
              width={500}
              height={500}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
