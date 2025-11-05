export default function Features() {
  const features = [
    {
      title: "Real-Time Tracking",
      description: "Monitor vaccine stock levels across all locations in real-time with instant alerts.",
      icon: "📊",
    },
    {
      title: "Smart Inventory",
      description: "Automatic stock predictions and reorder suggestions based on usage patterns.",
      icon: "🤖",
    },
    {
      title: "Compliance Ready",
      description: "Built-in compliance checks and detailed audit trails for regulatory requirements.",
      icon: "✅",
    },
    {
      title: "Multi-Location",
      description: "Manage unlimited locations from a single dashboard with role-based access.",
      icon: "🏥",
    },
    {
      title: "Integration",
      description: "Seamlessly integrate with existing EHR and pharmacy management systems.",
      icon: "🔗",
    },
    {
      title: "24/7 Support",
      description: "Dedicated support team available round the clock for assistance.",
      icon: "💬",
    },
  ]

  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Powerful Features for Your Needs
          </h2>
          <p className="text-xl text-foreground/60">Everything you need to manage vaccine inventory efficiently</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-card rounded-xl p-8 border border-border hover:border-primary/50 transition">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-foreground/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
