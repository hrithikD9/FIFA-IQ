import React from 'react'
import messiAvatar from '../assets/Messi.png'
import ronaldoAvatar from '../assets/Ronaldo.png'

const featureCards = [
  {
    className: 'px-8 py-6 bg-[#313450] col-start-1 col-end-3 space-y-3 rounded-3xl',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
        className="size-6 text-[#ADC6FF]">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
    title: 'Deep Tactical Analysis',
    description: 'Analyze positioning, passing networks, and defensive structures with sub-second precision. Our engine processes live feeds to reveal patterns invisible to the naked eye.',
  },
  {
    className: 'px-8 py-6 bg-[#313450] space-y-3 rounded-3xl',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
        className="size-6 text-[#ADC6FF]">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
    title: 'AI Predictions',
    description: 'Leverage neural networks to forecast match outcomes, player performance, and tactical shifts before they happen.',
  },
  {
    className: 'px-8 py-6 bg-[#30344f] space-y-3 rounded-3xl',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        className="lucide lucide-history-icon lucide-history text-[#ADC6FF]">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
    title: 'Historical Depth',
    description: 'Analyze positioning, passing networks, and defensive structures with sub-second precision. Our engine processes live feeds to reveal patterns invisible to the naked eye.',
  },
]

const FeatureCard = () => {
    return (
    <section className="space-y-10">
    <div className="space-y-4 px-6 max-w-4xl">
      <h2 className="text-4xl font-bold">Elite Capabilities</h2>
      <p className="
      text-[#C2C6D6]
        font-light
        tracking-widest
        leading-5
        max-w-4xl
        ">A suite of tools designed for the modern tactician ,
        powered by millions of historical data points </p>
    </div>

    <div className="gap-2 m-6 grid grid-cols-3">

      {featureCards.map((feature) => (
        <div key={feature.title} className={feature.className}>
          {feature.icon}
          <h3 className="text-2xl font-bold">{feature.title}</h3>
          <p className="tracking-tight text-[#C2C6D6]">{feature.description}</p>
        </div>
      ))}

      <div className="px-8 py-6 bg-[#313450] col-start-2 col-end-4 space-y-3 rounded-3xl">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        className="lucide lucide-git-compare-arrows-icon lucide-git-compare-arrows text-[#ADC6FF]">
        <circle cx="5" cy="6" r="3" />
        <path d="M12 6h5a2 2 0 0 1 2 2v7" />
        <path d="m15 9-3-3 3-3" />
        <circle cx="19" cy="18" r="3" />
          <path d="M12 18H7a2 2 0 0 1-2-2V9" />
          <path d="m9 15 3 3-3 3" />
        </svg>
        <h3 className="text-2xl font-bold">Player Profile Comparison</h3>
        <p className="tracking-tight text-[#C2C6D6]">Benchmark players across 150+ metrics. Use our Radar
          Comparison to visualize strengths and tactical fit for
          your system.
        </p>

        <div className="flex -space-x-5 justify-center">
          <img className="h-48 w-32 border border-[#313450] rounded-full" src={messiAvatar} alt="Lionel Messi"/>
          <img className="h-48 w-32 border border-[#313450] rounded-full" src={ronaldoAvatar} alt="Cristiano Ronaldo"/>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="lucide lucide-circle-gauge-icon lucide-circle-gauge">
            <path d="M15.6 2.7a10 10 0 1 0 5.7 5.7" />
            <circle cx="12" cy="12" r="2" />
            <path d="M13.4 10.6 19 5" />
          </svg>
        </div>
      </div>
    </div>
  </section>
    )
}

export default FeatureCard
