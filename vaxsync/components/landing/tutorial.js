"use client"

import { useState } from "react"

export default function Tutorial() {
  const [activeInfo, setActiveInfo] = useState(0)

  const images = [
    "/rhu1.jpg",
    "/service.jpg",
    "/vaccine.jpg",
    "/hours and loc.jpg"
  ]

  const rhuInfo = [
    {
      title: "About RHU 1 Daet",
      description:
        "Rural Health Unit 1 of Daet, Camarines Norte is a primary healthcare facility serving the communities of Daet. We provide comprehensive health services including immunization, maternal health, disease surveillance, and health promotion programs.",
      icon: <img src="/task.png" alt="RHU 1 Logo" className="w-12 h-12 square-full" />
    },
    {
      title: "Our Services",
      description:
        "We offer immunization services, prenatal and postnatal care, family planning services, basic healthcare consultations, and disease prevention programs. Our team is committed to providing accessible and quality healthcare to all residents.",
      icon: <img src="/nurse.png" alt="RHU 1 Logo" className="w-12 h-12 square-full" />
    },
    {
      title: "Vaccine Management",
      description:
        "We maintain a comprehensive vaccine inventory including routine immunizations for infants, children, adolescents, and adults. All vaccines are stored in proper cold chain conditions to ensure efficacy and safety.",
      icon: <img src="/injection.png" alt="RHU 1 Logo" className="w-12 h-12 square-full" />
    },
    {
      title: "Operating Hours & Location",
      description:
        "RHU 1 is located in Daet, Camarines Norte. We are open Monday to Friday from 8:00 AM to 5:00 PM. For emergencies, we provide referral services to higher health facilities. Contact us for more information about our services.",
      icon: <img src="/clock.png" alt="RHU 1 Logo" className="w-12 h-12 square-full" />
    },
  ]

  return (
    <section id="rhu-info" className="py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Rural Health Unit 1 Daet</h2>
          <p className="text-xl text-foreground/60">Camarines Norte's Community Healthcare Facility</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Info list - icons with titles */}
          <div className="space-y-4">
            {rhuInfo.map((info, index) => (
              <div
                key={index}
                onClick={() => setActiveInfo(index)}
                className={`p-4 rounded-xl cursor-pointer transition flex items-center gap-4 ${
                  activeInfo === index ? "ring-2 ring-green-500 bg-white" : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <div className="flex-shrink-0">
                  {info.icon}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{info.title}</h3>
                  {activeInfo === index && <p className="text-sm opacity-90">{info.description}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Active info detail - shows large image only */}
          <div className="bg-accent/10 rounded-2xl p-12 flex items-center justify-center min-h-96">
            <img src={images[activeInfo]} alt={rhuInfo[activeInfo].title} className="w-full h-auto max-w-lg object-cover rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  )
}