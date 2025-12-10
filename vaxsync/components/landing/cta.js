"use client"

export default function CTA({ onGetStarted }) {
  return (
    <section
      id="pricing"
      className="py-20 md:py-32 bg-gradient-to-br from-green-200 via-green-300 to-green-500"
    >
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
          Ready to Streamline<br />Your Vaccine Inventory?
        </h2>

        <p className="text-lg text-foreground/70 mb-12 leading-relaxed max-w-2xl mx-auto">
          Join hundreds of healthcare facilities managing their vaccine inventory with VaxSync. Start your hassle free inventory.me
        </p>

        <div className="grid sm:grid-cols-3 gap-8 mb-16 pb-12 border-b border-foreground/20">
          <div>
            <p className="text-4xl font-bold text-foreground mb-1">100%</p>
            <p className="text-foreground/70 text-sm">Reliable</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-foreground mb-1">Free</p>
            <p className="text-foreground/70 text-sm">No cost</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-foreground mb-1">24/7</p>
            <p className="text-foreground/70 text-sm">Support Available</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-foreground/80">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>rhu@gov.ph</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>0949 4555 509</span>
          </div>
        </div>
      </div>
    </section>
  )
}