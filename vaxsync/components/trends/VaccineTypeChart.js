'use client';

import { useEffect, useRef } from 'react';

export default function VaccineTypeChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2 - 20;
    const radius = Math.min(width, height) / 3;

    ctx.clearRect(0, 0, width, height);

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Draw pie slices
    let currentAngle = -Math.PI / 2; // Start at top
    
    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
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
      
      // Draw percentage label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${item.value}%`, labelX, labelY);
      
      currentAngle += sliceAngle;
    });

    // Draw legend
    const legendX = 20;
    let legendY = height - data.length * 25 - 10;
    
    data.forEach((item) => {
      // Color box
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY, 15, 15);
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX, legendY, 15, 15);
      
      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${item.name} (${item.value}%)`, legendX + 25, legendY + 7.5);
      
      legendY += 25;
    });

  }, [data]);

  return (
    <div className="w-full h-80">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
