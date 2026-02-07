'use client';

import { useState, useRef, useEffect } from 'react';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: 'India' },
  { code: '+1', country: 'US', label: 'United States' },
  { code: '+44', country: 'GB', label: 'United Kingdom' },
  { code: '+61', country: 'AU', label: 'Australia' },
  { code: '+81', country: 'JP', label: 'Japan' },
  { code: '+49', country: 'DE', label: 'Germany' },
  { code: '+33', country: 'FR', label: 'France' },
  { code: '+86', country: 'CN', label: 'China' },
  { code: '+971', country: 'AE', label: 'UAE' },
  { code: '+65', country: 'SG', label: 'Singapore' },
  { code: '+55', country: 'BR', label: 'Brazil' },
  { code: '+7', country: 'RU', label: 'Russia' },
  { code: '+82', country: 'KR', label: 'South Korea' },
  { code: '+39', country: 'IT', label: 'Italy' },
  { code: '+34', country: 'ES', label: 'Spain' },
  { code: '+31', country: 'NL', label: 'Netherlands' },
  { code: '+46', country: 'SE', label: 'Sweden' },
  { code: '+41', country: 'CH', label: 'Switzerland' },
  { code: '+62', country: 'ID', label: 'Indonesia' },
  { code: '+60', country: 'MY', label: 'Malaysia' },
  { code: '+63', country: 'PH', label: 'Philippines' },
  { code: '+66', country: 'TH', label: 'Thailand' },
  { code: '+90', country: 'TR', label: 'Turkey' },
  { code: '+48', country: 'PL', label: 'Poland' },
  { code: '+27', country: 'ZA', label: 'South Africa' },
  { code: '+234', country: 'NG', label: 'Nigeria' },
  { code: '+254', country: 'KE', label: 'Kenya' },
  { code: '+92', country: 'PK', label: 'Pakistan' },
  { code: '+880', country: 'BD', label: 'Bangladesh' },
  { code: '+94', country: 'LK', label: 'Sri Lanka' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function PhoneInput({ value, onChange, placeholder = 'Phone number', className = '', required, disabled }: PhoneInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse existing value to extract country code
  const getSelectedCode = () => {
    for (const cc of COUNTRY_CODES) {
      if (value.startsWith(cc.code + ' ') || value.startsWith(cc.code)) {
        return cc;
      }
    }
    return COUNTRY_CODES[0]; // Default to India
  };

  const selectedCode = getSelectedCode();

  const getPhoneNumber = () => {
    if (value.startsWith(selectedCode.code + ' ')) {
      return value.slice(selectedCode.code.length + 1);
    }
    if (value.startsWith(selectedCode.code)) {
      return value.slice(selectedCode.code.length);
    }
    // If no code prefix, return the value as-is
    for (const cc of COUNTRY_CODES) {
      if (value.startsWith(cc.code)) {
        return value.slice(cc.code.length).trimStart();
      }
    }
    return value;
  };

  const handleCodeSelect = (code: typeof COUNTRY_CODES[0]) => {
    const phoneNum = getPhoneNumber();
    onChange(phoneNum ? `${code.code} ${phoneNum}` : code.code + ' ');
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handlePhoneChange = (phoneNum: string) => {
    onChange(phoneNum ? `${selectedCode.code} ${phoneNum}` : '');
  };

  const filteredCodes = searchQuery
    ? COUNTRY_CODES.filter(
        (cc) =>
          cc.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cc.code.includes(searchQuery) ||
          cc.country.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COUNTRY_CODES;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`flex ${className}`} ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-2.5 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-full"
        >
          <span className="font-medium">{selectedCode.code}</span>
          <svg className={`w-3 h-3 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredCodes.map((cc) => (
                <button
                  key={cc.code + cc.country}
                  type="button"
                  onClick={() => handleCodeSelect(cc)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${
                    selectedCode.code === cc.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span>{cc.label} ({cc.country})</span>
                  <span className="text-gray-500 font-mono text-xs">{cc.code}</span>
                </button>
              ))}
              {filteredCodes.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400">No results</div>
              )}
            </div>
          </div>
        )}
      </div>
      <input
        type="tel"
        value={getPhoneNumber()}
        onChange={(e) => handlePhoneChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
      />
    </div>
  );
}
