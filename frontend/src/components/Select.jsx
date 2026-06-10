import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { useDropdown } from '../context/DropdownContext';

export default function Select({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  searchable = false,
  disabled = false,
  className = '',
  error = false,
  label,
  helperText,
  size = 'md',
  showClear = false,
  required = false,
  name,
}) {
  const dropdownId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const { registerDropdown, unregisterDropdown, dropdownZIndex, activeDropdown } = useDropdown();

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label || placeholder;

  // Filter options based on search
  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(0);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(0);
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-5 py-4 text-base',
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
          id={id}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
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
            group
          `}
        >
          <span className="flex items-center gap-2 flex-1 text-left truncate">
            <span className={value === '' ? 'text-slate-500 dark:text-slate-400' : ''}>
              {selectedLabel}
            </span>
          </span>

          <span className="flex items-center gap-2 flex-shrink-0 ml-2">
            {showClear && value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-slate-600 dark:text-slate-400 transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </span>
        </button>

        {isOpen && (
          <div
            className={`
              absolute top-full left-0 right-0 mt-2
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-700
              rounded-2xl shadow-lg dark:shadow-2xl
              overflow-hidden animate-in fade-in zoom-in-95 duration-200
            `}
            style={{ zIndex: dropdownZIndex }}
          >
            {/* Search Input */}
            {searchable && (
              <div className="border-b border-slate-200 dark:border-slate-700 p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    className={`
                      w-full pl-9 pr-3 py-2 rounded-xl text-sm
                      border border-slate-200 dark:border-slate-700
                      bg-slate-50 dark:bg-slate-800
                      text-slate-900 dark:text-slate-100
                      placeholder-slate-500 dark:placeholder-slate-400
                      focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                      transition-all duration-200
                    `}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-sm">No options found</p>
                </div>
              ) : (
                <ul className="py-2">
                  {filteredOptions.map((option, index) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => handleSelect(option)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`
                          w-full px-4 py-2.5 text-left text-sm
                          flex items-center justify-between
                          transition-all duration-150
                          ${
                            value === option.value
                              ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
                              : highlightedIndex === index
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }
                        `}
                      >
                        <span>{option.label}</span>
                        {value === option.value && (
                          <span className="text-primary-600 dark:text-primary-400 font-bold">✓</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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

// Support for old format (value prop)
Select.defaultProps = {
  options: [],
  placeholder: 'Select an option',
  searchable: false,
  disabled: false,
  error: false,
  size: 'md',
  showClear: false,
  required: false,
};