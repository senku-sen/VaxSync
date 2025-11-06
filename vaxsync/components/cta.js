"use client"

export default function CTA({ onGetStarted }) {
  return (
    <section
      id="pricing"
      className="py-20 md:py-32 bg-gradient-to-br from-green-200 via-green-300 to-green-500"
    >
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
          Ready to Streamline Your Vaccine Inventory?
        </h2>

        <p className="text-xl text-foreground/60 mb-8 leading-relaxed max-w-2xl mx-auto">
          Join hundreds of healthcare facilities managing their vaccine inventory with VaxSync. 
          Start your free trial today—no credit card required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 border-2 border-primary text-primary rounded-lg font-bold text-lg hover:bg-primary/5 transition"
          >
            Start Now
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 pt-12 border-t border-border">
          <div>
            <p className="text-3xl font-bold text-foreground">100%</p>
            <p className="text-foreground/60">Reliability</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">Zero</p>
            <p className="text-foreground/60">Credit Card Required</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">24/7</p>
            <p className="text-foreground/60">Support Available</p>
          </div>
        </div>
      </div>
    </section>
  )
}
