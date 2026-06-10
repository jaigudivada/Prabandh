import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const DropdownContext = createContext(null);

export function DropdownProvider({ children }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownZIndex, setDropdownZIndex] = useState(50);

  // Register a dropdown as active
  const registerDropdown = useCallback((id) => {
    setActiveDropdown(id);
    setDropdownZIndex(prev => prev + 1);
  }, []);

  // Unregister a dropdown (close it)
  const unregisterDropdown = useCallback((id) => {
    setActiveDropdown(prev => prev === id ? null : prev);
  }, []);

  // Close all dropdowns
  const closeAllDropdowns = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  // Check if a specific dropdown is active
  const isDropdownActive = useCallback((id) => {
    return activeDropdown === id;
  }, [activeDropdown]);

  // Global escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeAllDropdowns();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeAllDropdowns]);

  // Global outside click handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside any dropdown
      const dropdownElements = document.querySelectorAll('[data-dropdown-container]');
      let clickedInsideDropdown = false;
      
      dropdownElements.forEach(el => {
        if (el.contains(e.target)) {
          clickedInsideDropdown = true;
        }
      });

      if (!clickedInsideDropdown && activeDropdown) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, closeAllDropdowns]);

  // Close all dropdowns on route change
  useEffect(() => {
    const handleRouteChange = () => {
      closeAllDropdowns();
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [closeAllDropdowns]);

  const value = {
    activeDropdown,
    dropdownZIndex,
    registerDropdown,
    unregisterDropdown,
    closeAllDropdowns,
    isDropdownActive,
  };

  return (
    <DropdownContext.Provider value={value}>
      {children}
    </DropdownContext.Provider>
  );
}

export function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdown must be used within a DropdownProvider');
  }
  return context;
}
