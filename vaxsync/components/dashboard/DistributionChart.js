'use client';

import { useEffect, useRef } from 'react';

export default function DistributionChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    let currentAngle = -Math.PI / 2; // Start at top

    data.forEach((item) => {
      const sliceAngle = (item.value / 100) * 2 * Math.PI;

      // Draw slice
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

  }, [data]);

  return (
    <div className="flex items-center justify-between h-64">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="w-48 h-48"
      />
      
      {/* Legend */}
      <div className="flex flex-col gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">
              {item.name}: {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
