import React, { useState, useRef, useEffect, useId } from 'react';
import { Clock, X } from 'lucide-react';
import { useDropdown } from '../context/DropdownContext';

export default function TimePicker({
  id,
  value = '',
  onChange,
  disabled = false,
  className = '',
  error = false,
  label,
  helperText,
  required = false,
  size = 'md',
}) {
  const dropdownId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(value ? parseInt(value.split(':')[0]) : 12);
  const [minutes, setMinutes] = useState(value ? parseInt(value.split(':')[1]) : 0);
  const containerRef = useRef(null);
  const { registerDropdown, unregisterDropdown, dropdownZIndex, activeDropdown } = useDropdown();

  // Register/unregister dropdown with global context — DropdownContext handles escape + outside click globally
  useEffect(() => {
    if (isOpen) {
      registerDropdown(dropdownId);
    } else {
      unregisterDropdown(dropdownId);
    }
    return () => unregisterDropdown(dropdownId);
  }, [isOpen, dropdownId, registerDropdown, unregisterDropdown]);

  // Sync with DropdownContext — close when globally deactivated
  useEffect(() => {
    if (isOpen && activeDropdown !== dropdownId) {
      setIsOpen(false);
    }
  }, [activeDropdown, dropdownId]);

  // Update hours and minutes when value changes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHours(parseInt(h));
      setMinutes(parseInt(m));
    }
  }, [value]);

  const formatTime = (h, m) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    const h = Math.max(0, Math.min(23, hours));
    const m = Math.max(0, Math.min(59, minutes));
    onChange(formatTime(h, m));
    setHours(h);
    setMinutes(m);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setHours(12);
    setMinutes(0);
    setIsOpen(false);
  };

  const handleHourChange = (val) => {
    const num = Math.max(0, Math.min(23, parseInt(val) || 0));
    setHours(num);
  };

  const handleMinuteChange = (val) => {
    const num = Math.max(0, Math.min(59, parseInt(val) || 0));
    setMinutes(num);
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-5 py-4 text-base',
  };

  const displayTime = value || '';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative" ref={containerRef} data-dropdown-container>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between
            ${sizeClasses[size]}
            rounded-2xl border transition-all duration-200
            ${
              isOpen
                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/30 ring-2 ring-primary-500/20'
                : error
                ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/20'
                : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer'}
            text-slate-900 dark:text-slate-100
            focus:outline-none focus:ring-2 focus:ring-primary-500/20
          `}
        >
          <span className="flex items-center gap-3 flex-1">
            <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <span className={value ? 'font-medium' : 'text-slate-500 dark:text-slate-400'}>
              {displayTime || 'Select time'}
            </span>
          </span>

          <span className="flex items-center gap-2 flex-shrink-0">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
            )}
          </span>
        </button>

        {/* Time Picker Popup */}
        {isOpen && (
          <div
            className={`
              absolute top-full left-0 right-0 mt-2
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-700
              rounded-2xl shadow-lg dark:shadow-2xl
              p-6 w-64 animate-in fade-in zoom-in-95 duration-200
            `}
            style={{ zIndex: dropdownZIndex }}
          >
            {/* Time Input */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {/* Hours Input */}
              <div className="flex flex-col items-center">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Hour
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={String(hours).padStart(2, '0')}
                  onChange={(e) => handleHourChange(e.target.value)}
                  className={`
                    w-14 px-2 py-2 text-center text-xl font-bold
                    rounded-xl border border-slate-300 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800
                    text-slate-900 dark:text-slate-100
                    focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                    transition-all duration-200
                  `}
                />
              </div>

              {/* Separator */}
              <div className="text-2xl font-bold text-slate-400 mt-6">:</div>

              {/* Minutes Input */}
              <div className="flex flex-col items-center">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Minute
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={String(minutes).padStart(2, '0')}
                  onChange={(e) => handleMinuteChange(e.target.value)}
                  className={`
                    w-14 px-2 py-2 text-center text-xl font-bold
                    rounded-xl border border-slate-300 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800
                    text-slate-900 dark:text-slate-100
                    focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                    transition-all duration-200
                  `}
                />
              </div>
            </div>

            {/* Quick Select Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['09:00', '12:00', '14:00', '17:00'].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    const [h, m] = time.split(':');
                    const hNum = parseInt(h);
                    const mNum = parseInt(m);
                    setHours(hNum);
                    setMinutes(mNum);
                    onChange(formatTime(hNum, mNum));
                    setIsOpen(false);
                  }}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-lg
                    transition-all duration-150
                    ${
                      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` === time
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  {time}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`
                  flex-1 px-3 py-2 rounded-lg font-medium text-sm
                  transition-all duration-150
                  bg-slate-100 dark:bg-slate-800
                  text-slate-700 dark:text-slate-300
                  hover:bg-slate-200 dark:hover:bg-slate-700
                `}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`
                  flex-1 px-3 py-2 rounded-lg font-medium text-sm
                  transition-all duration-150
                  bg-primary-600 text-white
                  hover:bg-primary-700 active:scale-95
                `}
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>

      {helperText && (
        <p className={`mt-1 text-xs ${error ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
}

TimePicker.defaultProps = {
  value: '',
  disabled: false,
  error: false,
  required: false,
  size: 'md',
};