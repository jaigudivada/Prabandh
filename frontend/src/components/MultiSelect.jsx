import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { useDropdown } from '../context/DropdownContext';

export default function MultiSelect({
  id,
  value = [],
  onChange,
  options = [],
  placeholder = 'Select options',
  searchable = false,
  disabled = false,
  className = '',
  error = false,
  label,
  helperText,
  size = 'md',
  required = false,
  name,
  maxItems,
}) {
  const dropdownId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const { registerDropdown, unregisterDropdown, dropdownZIndex, activeDropdown } = useDropdown();

  // Filter options based on search
  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          !value.includes(opt.value) &&
          (opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            opt.value.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : options.filter((opt) => !value.includes(opt.value));

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
        setHighlightedIndex((prev) =>
          prev - 1 < 0 ? filteredOptions.length - 1 : prev - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        // Handled by the useEffect above
        break;
      default:
        break;
    }
  };

  const handleSelect = (option) => {
    if (maxItems && value.length >= maxItems) return;
    const newValue = [...value, option.value];
    onChange(newValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(0);
  };

  const handleRemove = (valueToRemove) => {
    onChange(value.filter((v) => v !== valueToRemove));
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
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

  const selectedLabels = value
    .map((v) => options.find((opt) => opt.value === v)?.label)
    .filter(Boolean);

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
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between
            min-h-[44px] rounded-2xl border transition-all duration-200
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
          {/* Selected Tags */}
          <span className="flex items-center gap-2 flex-wrap flex-1 text-left">
            {value.length === 0 ? (
              <span className="text-slate-500 dark:text-slate-400 text-sm">
                {placeholder}
              </span>
            ) : (
              value.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-medium"
                >
                  {options.find((opt) => opt.value === v)?.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(v);
                    }}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </span>

          {/* Action Icons */}
          <span className="flex items-center gap-2 flex-shrink-0 ml-2">
            {value.length > 0 && (
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

        {/* Dropdown Menu */}
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
                  <p className="text-sm">
                    {searchTerm ? 'No options found' : 'All selected'}
                  </p>
                </div>
              ) : (
                <ul className="py-2">
                  {filteredOptions.map((option, index) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => handleSelect(option)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        disabled={maxItems && value.length >= maxItems}
                        className={`
                          w-full px-4 py-2.5 text-left text-sm
                          flex items-center justify-between
                          transition-all duration-150
                          ${
                            highlightedIndex === index
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }
                          ${
                            maxItems && value.length >= maxItems && !value.includes(option.value)
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }
                        `}
                      >
                        <span>{option.label}</span>
                        {value.includes(option.value) && (
                          <span className="text-primary-600 dark:text-primary-400 font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer Info */}
            {maxItems && (
              <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
                {value.length} / {maxItems} selected
              </div>
            )}
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

MultiSelect.defaultProps = {
  value: [],
  options: [],
  placeholder: 'Select options',
  searchable: false,
  disabled: false,
  error: false,
  size: 'md',
  required: false,
};