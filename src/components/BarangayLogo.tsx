// src/components/BarangayLogo.tsx
import React from 'react';

interface BarangayLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const BarangayLogo: React.FC<BarangayLogoProps> = ({ size = 48, className = '', showText = false }) => {
  return (
    <div className={className} style={{ display:'inline-flex', alignItems:'center', gap:'10px' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink:0, filter:'drop-shadow(0 2px 5px rgba(0,0,0,0.15))' }}>
        <circle cx="50" cy="50" r="47" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
        <circle cx="50" cy="50" r="43" fill="#0D6840" />
        <circle cx="50" cy="50" r="39" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
        <path d="M50 20 L68 28 C68 45 60 62 50 72 C40 62 32 45 32 28 Z" fill="#0F325E" stroke="#F59E0B" strokeWidth="1.5" />
        <path d="M50 48 L65 37 C64 50 58 63 50 70 C42 63 36 50 35 37 Z" fill="#DC2626" />
        <circle cx="50" cy="40" r="6" fill="#FBBF24" />
        <path d="M50 29 L50 32 M50 48 L50 51 M39 40 L42 40 M58 40 L61 40 M42 32 L44 34 M56 46 L58 48 M42 48 L44 46 M56 34 L58 32"
          stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M24 74 Q50 82 76 74 Q74 81 72 85 Q50 90 28 85 Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
        <text x="50" y="83" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#78350F" fontFamily="sans-serif" letterSpacing="0.8">ANTONINO</text>
        <path id="textArc" d="M22 45 A32 32 0 0 1 78 45" fill="none" />
        <text fontSize="4.5" fontWeight="bold" fill="#FFFFFF" letterSpacing="1">
          <textPath href="#textArc" startOffset="50%" textAnchor="middle">BARANGAY ANTONINO</textPath>
        </text>
      </svg>
      {showText && (
        <div style={{ textAlign:'left', lineHeight:1.2 }}>
          <div style={{ fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600, opacity:0.85 }}>Republika ng Pilipinas</div>
          <div style={{ fontSize:'16px', fontWeight:800, letterSpacing:'-0.2px' }}>Barangay Antonino</div>
        </div>
      )}
    </div>
  );
};

export default BarangayLogo;