'use client';

import React from 'react';
import { BRAND } from '../../config/brand';

export interface SightForgeLogoProps {
  variant?: 'mark' | 'horizontal' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  showDescriptor?: boolean;
}

export default function SightForgeLogo({
  variant = 'horizontal',
  size = 'md',
  showWordmark = true,
  className = '',
  showDescriptor = false,
}: SightForgeLogoProps) {
  const sizeMap = {
    sm: { mark: 26, text: 'text-sm', descriptor: 'text-[10px]' },
    md: { mark: 32, text: 'text-base', descriptor: 'text-[11px]' },
    lg: { mark: 40, text: 'text-lg', descriptor: 'text-xs' },
    xl: { mark: 48, text: 'text-xl', descriptor: 'text-sm' },
  };

  const { mark: markSize, text: textSize, descriptor: descSize } = sizeMap[size];

  const renderMark = () => (
    <div
      style={{ width: markSize, height: markSize }}
      className="shrink-0 rounded-lg bg-[#1B1D1A] flex items-center justify-center text-white shadow-xs border border-[#D9DCD5] relative overflow-hidden"
    >
      {/* Precision corner ticks in yellow and green */}
      <svg
        width={markSize * 0.62}
        height={markSize * 0.62}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Top-left corner (Yellow) */}
        <path d="M3 8V5a2 2 0 0 1 2-2h3" stroke="#E7B900" />
        {/* Top-right corner (Charcoal/White) */}
        <path d="M16 3h3a2 2 0 0 1 2 2v3" stroke="#FFFFFF" />
        {/* Bottom-right corner (Green) */}
        <path d="M21 16v3a2 2 0 0 1-2 2h-3" stroke="#3F8F5B" />
        {/* Bottom-left corner (Charcoal/White) */}
        <path d="M8 21H5a2 2 0 0 1-2-2v-3" stroke="#FFFFFF" />
        {/* Center Optical Crosshair */}
        <circle cx="12" cy="12" r="2.8" stroke="#E7B900" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="1.1" fill="#3F8F5B" />
      </svg>
    </div>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{renderMark()}</div>;
  }

  if (variant === 'wordmark') {
    return (
      <span className={`font-bold tracking-tight text-[#1B1D1A] font-sans ${textSize} ${className}`}>
        {BRAND.name}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {renderMark()}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-[#1B1D1A] font-sans ${textSize} leading-none`}>
              {BRAND.name}
            </span>
          </div>
          {showDescriptor && (
            <span className={`text-[#747A73] leading-none mt-1 font-sans ${descSize}`}>
              {BRAND.descriptor}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
