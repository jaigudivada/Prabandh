import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { useDropdown } from '../context/DropdownContext';

export default function DatePicker({
  id,
  value = '',
  onChange,
  disabled = false,
  className = '',
  error = false,
  label,
  helperText,
  required = false,
  minDate,
  maxDate,
  size = 'md',
}) {
  const dropdownId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDaysArray = () => {
    const days = [];
    const firstDay = firstDayOfMonth(currentMonth);
    const daysCount = daysInMonth(currentMonth);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysCount; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateClick = (day) => {
    const formattedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const days = getDaysArray();
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const displayDate = value ? formatDate(value) : '';

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-5 py-4 text-base',
  };

  const isDateDisabled = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

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
            <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <span className={value ? '' : 'text-slate-500 dark:text-slate-400'}>
              {displayDate || 'Select date'}
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

        {/* Calendar Popup */}
        {isOpen && (
          <div
            className={`
              absolute top-full left-0 right-0 mt-2
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-700
              rounded-2xl shadow-lg dark:shadow-2xl
              p-4 w-72 animate-in fade-in zoom-in-95 duration-200
            `}
            style={{ zIndex: dropdownZIndex }}
          >
            {/* Month/Year Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                {monthYear}
              </h3>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 h-8 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div key={index} className="aspect-square">
                  {day ? (
                    <button
                      type="button"
                      onClick={() => handleDateClick(day)}
                      disabled={isDateDisabled(day)}
                      className={`
                        w-full h-full rounded-lg text-sm font-medium
                        transition-all duration-150 flex items-center justify-center
                        ${
                          value === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : isDateDisabled(day)
                            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }
                      `}
                    >
                      {day}
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
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

DatePicker.defaultProps = {
  value: '',
  disabled: false,
  error: false,
  required: false,
  size: 'md',
};