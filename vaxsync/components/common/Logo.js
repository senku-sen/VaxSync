export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Phone with Syringe and Checkmark */}
      <div className="relative">
        <svg width="100" height="140" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Phone outline */}
          <rect x="10" y="10" width="60" height="110" rx="8" stroke="#1e3a5f" strokeWidth="5" fill="white"/>
          
          {/* Phone notch */}
          <rect x="35" y="10" width="20" height="8" rx="4" fill="#1e3a5f"/>
          
          {/* Syringe */}
          <g transform="translate(25, 35)">
            {/* Syringe plunger top */}
            <rect x="10" y="0" width="20" height="8" rx="4" fill="#4a7c9e"/>
            
            {/* Syringe barrel */}
            <rect x="12" y="8" width="16" height="40" rx="3" fill="#4a7c9e"/>
            
            {/* Measurement marks */}
            <line x1="12" y1="15" x2="28" y2="15" stroke="white" strokeWidth="1.5"/>
            <line x1="12" y1="22" x2="28" y2="22" stroke="white" strokeWidth="1.5"/>
            <line x1="12" y1="29" x2="28" y2="29" stroke="white" strokeWidth="1.5"/>
            <line x1="12" y1="36" x2="28" y2="36" stroke="white" strokeWidth="1.5"/>
            <line x1="12" y1="43" x2="28" y2="43" stroke="white" strokeWidth="1.5"/>
            
            {/* Syringe needle */}
            <path d="M 18 48 L 16 58 L 24 58 L 22 48 Z" fill="#4a7c9e"/>
            <rect x="18.5" y="58" width="3" height="12" fill="#1e3a5f"/>
          </g>
          
          {/* Checkmark Circle */}
          <circle cx="65" cy="85" r="22" fill="#5dada6"/>
          
          {/* Checkmark */}
          <path d="M 55 85 L 62 92 L 75 78" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </div>
      
      {/* VaxSync Text */}
      <span className="text-5xl font-bold text-[#1e3a5f] tracking-tight">
        VaxSync
      </span>
    </div>
  );
}
