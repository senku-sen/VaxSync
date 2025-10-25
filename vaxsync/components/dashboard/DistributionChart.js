'use client';

import { useEffect, useRef, useState } from 'react';

export default function DistributionChart({ data }) {
  const canvasRef = useRef(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    // Reset animation
    setAnimationProgress(0);
    
    // Animate from 0 to 1 over 1.5 seconds
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [data]);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get actual canvas dimensions
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size in memory
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale context
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;

    // Calculate total for percentage
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    let currentAngle = -Math.PI / 2; // Start at top

    data.forEach((item, index) => {
      // Calculate slice angle based on actual value
      const percentage = (item.value / total) * 100;
      const sliceAngle = (percentage / 100) * 2 * Math.PI;
      
      // Animate each slice with stagger effect
      const sliceDelay = index * 0.15;
      const sliceProgress = Math.max(0, Math.min(1, (animationProgress - sliceDelay) / (1 - sliceDelay)));
      const animatedAngle = sliceAngle * sliceProgress;
      
      // Scale animation for slice
      const scaleProgress = Math.max(0, Math.min(1, (animationProgress - sliceDelay) / 0.3));
      const scale = 0.5 + (0.5 * scaleProgress);

      if (sliceProgress > 0) {
        // Draw slice with shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = item.color;
        ctx.globalAlpha = sliceProgress;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius * scale, currentAngle, currentAngle + animatedAngle);
        ctx.closePath();
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw border between slices
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Draw percentage label on slice if it's large enough (fade in)
        if (percentage > 8 && sliceProgress > 0.7) {
          const labelProgress = (sliceProgress - 0.7) / 0.3;
          const labelAngle = currentAngle + animatedAngle / 2;
          const labelRadius = radius * scale * 0.7;
          const labelX = centerX + Math.cos(labelAngle) * labelRadius;
          const labelY = centerY + Math.sin(labelAngle) * labelRadius;
          
          ctx.globalAlpha = labelProgress;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.round(percentage)}%`, labelX, labelY);
          ctx.globalAlpha = 1;
        }
      }

      currentAngle += sliceAngle;
    });

  }, [data, animationProgress]);

  // Calculate total and percentages for legend
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1)
  }));

  return (
    <div className="flex items-center justify-between gap-6 h-64">
      <canvas
        ref={canvasRef}
        style={{ width: '200px', height: '200px' }}
        className="flex-shrink-0"
      />
      
      {/* Legend */}
      <div className="flex flex-col gap-3 flex-1">
        {dataWithPercentages.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700 font-medium">
                {item.name}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-800">
              {item.percentage}%
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">Total</span>
          <span className="text-sm font-bold text-gray-800">{total} doses</span>
        </div>
      </div>
    </div>
  );
}
