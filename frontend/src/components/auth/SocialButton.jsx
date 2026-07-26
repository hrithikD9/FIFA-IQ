import React from 'react'

const SocialButton = ({ icon, label, onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#262A35] text-[#DFE2F1] font-semibold text-sm cursor-pointer transition-colors hover:bg-[#343946] hover:text-white"
        >
            {React.createElement(icon, {
                className: 'size-4.5',
                strokeWidth: 2,
            })}
            {label}
        </button>
    )
}

export default SocialButton
