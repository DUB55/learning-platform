'use client';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    description?: string;
}

export default function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    label,
    description
}: ToggleSwitchProps) {

    const sizes = {
        sm: {
            track: 'w-9 h-5',
            thumb: 'w-4 h-4',
            translate: 'translate-x-4',
        },
        md: {
            track: 'w-11 h-6',
            thumb: 'w-5 h-5',
            translate: 'translate-x-5',
        },
        lg: {
            track: 'w-14 h-7',
            thumb: 'w-6 h-6',
            translate: 'translate-x-7',
        },
    };

    const currentSize = sizes[size];

    const handleClick = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <div className={`flex items-center justify-between ${label ? 'py-2' : ''}`}>
            {(label || description) && (
                <div className="flex-1 mr-4">
                    {label && (
                        <label className="text-sm font-medium text-white cursor-pointer" onClick={handleClick}>
                            {label}
                        </label>
                    )}
                    {description && (
                        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                    )}
                </div>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                disabled={disabled}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                className={`
                    relative inline-flex flex-shrink-0 cursor-pointer rounded-full
                    transition-colors duration-200 ease-in-out
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                    ${currentSize.track}
                    ${checked ? 'bg-blue-500' : 'bg-slate-600'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}
                `}
            >
                <span className="sr-only">{label || 'Toggle'}</span>
                <span
                    aria-hidden="true"
                    className={`
                        pointer-events-none inline-block rounded-full bg-white shadow-lg
                        transform ring-0 transition duration-200 ease-in-out
                        ${currentSize.thumb}
                        ${checked ? currentSize.translate : 'translate-x-0.5'}
                        mt-0.5
                    `}
                />
            </button>
        </div>
    );
}
