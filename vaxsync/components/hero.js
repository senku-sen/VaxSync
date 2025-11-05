"use client"

export default function Hero({ onGetStarted }) {
  return (
    <section className="relative overflow-hidden pt-20 pb-32 md:pt-40 md:pb-48">
      {/* Background gradient circles */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none"></div>
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
                <p className="text-2xl font-bold text-foreground">10K+</p>
                <p className="text-sm text-foreground/60">Active Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">99.9%</p>
                <p className="text-sm text-foreground/60">Uptime</p>
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-primary to-primary/60 rounded-2xl p-8 aspect-square flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block mb-6">
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S14.33 6 13.5 6 12 6.67 12 7.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S7.33 6 6.5 6 5 6.67 5 7.5 5.67 9 6.5 9zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H4.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                    </svg>
                  </div>
                </div>
                <p className="text-white/80 text-lg font-medium">Track & Manage</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
