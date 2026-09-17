import React from 'react'

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="zm-brand-bg" x1="256" y1="36" x2="256" y2="476" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22252c" />
            <stop offset="1" stopColor="#111216" />
          </linearGradient>
          <linearGradient id="zm-facet-1" x1="136" y1="146" x2="194" y2="366" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2e75fa" />
            <stop offset="1" stopColor="#6147f0" />
          </linearGradient>
          <linearGradient id="zm-facet-2" x1="194" y1="366" x2="256" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6640ea" />
            <stop offset="1" stopColor="#992ee0" />
          </linearGradient>
          <linearGradient id="zm-facet-3" x1="256" y1="168" x2="318" y2="366" gradientUnits="userSpaceOnUse">
            <stop stopColor="#992ee0" />
            <stop offset="1" stopColor="#14aef2" />
          </linearGradient>
          <linearGradient id="zm-facet-4" x1="318" y1="366" x2="376" y2="146" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14aef2" />
            <stop offset="1" stopColor="#05d9c7" />
          </linearGradient>
        </defs>

        {/* Squircle Base with Deep Obsidian Titanium Plate */}
        <rect 
          x="36" 
          y="36" 
          width="440" 
          height="440" 
          rx="104" 
          fill="url(#zm-brand-bg)" 
          stroke="rgba(255,255,255,0.12)" 
          strokeWidth="3" 
        />

        {/* Origami Quantum M Glyph with Dynamic Migration Slant */}
        <g transform="translate(256 256) skewX(-5) translate(-256 -256)">
          {/* Facet 1: Left Pillar (Source / Ingress) */}
          <path d="M136 366 L194 366 L194 146 L136 204 Z" fill="url(#zm-facet-1)" />

          {/* Facet 2: Left Diagonal Fold (Descending Relay) */}
          <path d="M194 146 L256 270 L256 344 L194 220 Z" fill="url(#zm-facet-2)" />

          {/* Facet 3: Right Diagonal Fold (Ascending Synthesis) */}
          <path d="M256 270 L318 146 L318 220 L256 344 Z" fill="url(#zm-facet-3)" />

          {/* Facet 4: Right Pillar (Target / Forward Vector Egress) */}
          <path d="M318 146 L376 146 L376 366 L318 308 Z" fill="url(#zm-facet-4)" />
        </g>
      </svg>
    </div>
  )
}
