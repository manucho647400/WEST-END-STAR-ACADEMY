import React from 'react';

interface SchoolEmblemProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SchoolEmblem: React.FC<SchoolEmblemProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`relative shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 border-2 border-emerald-700/80 shadow-xs ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-4/5 h-4/5 text-amber-400 drop-shadow-xs"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Heraldic Shield Base */}
        <path
          d="M50 8 C68 8, 85 14, 85 28 C85 58, 68 84, 50 92 C32 84, 15 58, 15 28 C15 14, 32 8, 50 8 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-amber-400"
        />
        {/* Inner Shield Accent */}
        <path
          d="M50 16 C63 16, 77 21, 77 32 C77 56, 63 76, 50 83 C37 76, 23 56, 23 32 C23 21, 37 16, 50 16 Z"
          fill="#064e3b"
          opacity="0.9"
        />
        {/* Guiding Star of West End Star Academy */}
        <polygon
          points="50,22 53.5,33 65,33 55.5,40 59,51 50,44 41,51 44.5,40 35,33 46.5,33"
          fill="#fbbf24"
        />
        {/* Open Book of Knowledge & CBC Competencies */}
        <path
          d="M50 64 C43 59, 32 59, 29 61 L29 76 C32 74, 43 74, 50 79 C57 74, 68 74, 71 76 L71 61 C68 59, 57 59, 50 64 Z"
          fill="#f8fafc"
          stroke="#0f766e"
          strokeWidth="1.2"
        />
        <line x1="50" y1="64" x2="50" y2="79" stroke="#0f766e" strokeWidth="1.5" />
      </svg>
    </div>
  );
};
