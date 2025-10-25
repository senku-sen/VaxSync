'use client';

import { useEffect, useState } from 'react';

export default function StatsCard({ title, value, subtitle, valueColor = "text-[#93DA97]" }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    setIsVisible(true);

    // Animate number counting
    const duration = 1500;
    const startTime = Date.now();
    const startValue = 0;
    const endValue = typeof value === 'number' ? value : parseInt(value) || 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeProgress);
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-5 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase mb-2">{title}</p>
      <p className={`text-3xl font-bold ${valueColor} mb-1 transition-all duration-300`}>
        {displayValue}
      </p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
