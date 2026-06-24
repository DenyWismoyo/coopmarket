import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'vertical' | 'horizontal';
}

export const Logo = ({ className = "w-10 h-10", showText = false, variant = 'horizontal' }: LogoProps) => {
  return (
    <div className={`flex ${variant === 'vertical' ? 'flex-col text-center' : 'flex-row text-left'} items-center gap-2.5`}>
       {/* Bagian Icon SVG */}
       <svg 
          viewBox="0 0 512 512" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className={`${className} shrink-0 rounded-2xl shadow-sm transition-transform hover:scale-105`}
       >
          <rect width="512" height="512" rx="120" fill="#DC2626"/>
          <rect width="512" height="512" rx="120" fill="url(#paint0_linear_logo)" fillOpacity="0.1"/>
          <g transform="translate(106, 106) scale(0.6)">
             <path fillRule="evenodd" clipRule="evenodd" d="M250 50C167.157 50 100 117.157 100 200V250H50C22.3858 250 0 272.386 0 300V450C0 477.614 22.3858 500 50 500H450C477.614 500 500 477.614 500 450V300C500 272.386 477.614 250 450 250H400V200C400 117.157 332.843 50 250 50ZM150 200C150 144.772 194.772 100 250 100C305.228 100 350 144.772 350 200V250H150V200ZM250 280C211.34 280 180 311.34 180 350C180 388.66 211.34 420 250 420C288.66 420 320 388.66 320 350C320 311.34 288.66 280 250 280ZM230 350C230 361.046 238.954 370 250 370C261.046 370 270 361.046 270 350C270 338.954 261.046 330 250 330C238.954 330 230 338.954 230 350Z" fill="white"/>
          </g>
          <defs>
              <linearGradient id="paint0_linear_logo" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" stopOpacity="0.3"/>
                  <stop offset="1" stopColor="black" stopOpacity="0.1"/>
              </linearGradient>
          </defs>
       </svg>

       {/* Bagian Teks (Opsional) */}
       {showText && (
         <div className="flex flex-col leading-none">
            <span className={`font-bold text-gray-900 tracking-tight ${variant === 'vertical' ? 'text-2xl mt-2' : 'text-lg'}`}>
              CoopConnect
            </span>
            <span className={`font-bold text-red-600 uppercase tracking-widest ${variant === 'vertical' ? 'text-xs' : 'text-[0.6rem]'}`}>
              Koperasi Merah Putih
            </span>
         </div>
       )}
    </div>
  );
};