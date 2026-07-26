import React from 'react'

const FormInput = ({
    id,
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    icon,
    autoComplete,
    rightElement,
    labelRight,
}) => {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label
                    htmlFor={id}
                    className="text-xs font-semibold tracking-wider text-[#8C909F] uppercase"
                >
                    {label}
                </label>
                {labelRight}
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {React.createElement(icon, {
                        className: 'size-4.5 text-[#8C909F]',
                        strokeWidth: 2,
                    })}
                </div>

                <input
                    id={id}
                    name={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-[#171B26] border border-[#262A35] text-white text-sm placeholder-[#52627A] outline-none transition-colors focus:border-[#ADC6FF]/60 focus:bg-[#1B2030]"
                />

                {rightElement && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        {rightElement}
                    </div>
                )}
            </div>
        </div>
    )
}

export default FormInput
