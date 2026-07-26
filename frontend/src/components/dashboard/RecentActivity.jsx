import React from 'react'

const activities = [
    { text: 'Lionel Messi form trend updated', time: '2m ago', icon: 'LM' },
    { text: 'Liverpool FC press profile analyzed', time: '1h ago', icon: 'LF' },
    { text: 'Kylian Mbappe sprint load flagged', time: '3h ago', icon: 'KM' },
    { text: 'Japan NT possession model refreshed', time: '5h ago', icon: 'JP' },
]

const RecentActivity = () => {
    return (
        <section className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            <div className="mt-5 space-y-3">
                {activities.map((activity) => (
                    <div key={activity.text} className="flex items-center gap-3 rounded-2xl bg-[#171B26] px-4 py-3 text-sm font-semibold text-[#C2C6D6]">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 text-xs font-black text-[#ADC6FF]">
                            {activity.icon}
                        </span>
                        <span className="flex-1">{activity.text}</span>
                        <span className="text-xs font-bold text-[#66708A]">{activity.time}</span>
                    </div>
                ))}
            </div>
            <button className="mt-4 w-full rounded-xl border border-[#2B3244] bg-[#262A35] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#ADC6FF] hover:border-[#ADC6FF]/50 hover:bg-[#30364A]">
                Show More Activity
            </button>
            <div className="mt-5 rounded-2xl border border-[#D0BCFF]/30 bg-[#571BC1]/25 p-4">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#D0BCFF]">Market Volatility</p>
                <p className="mt-2 text-sm leading-6 text-[#E9ECF8]">
                    Player availability shifts increased match uncertainty by 8.7% across your tracked competitions.
                </p>
            </div>
        </section>
    )
}

export default RecentActivity