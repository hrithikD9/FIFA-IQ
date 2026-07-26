import React from 'react'

const StatusBadge = ({ icon, text }) => {
    return (
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171B26] border border-[#262A35] text-xs font-medium text-[#C2C6D6]">
            {icon}
            {text}
        </span>
    )
}

export default StatusBadge
