'use client';

import { useEffect, useRef } from 'react';

export default function MonthlyTrendChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find max value
    const maxValue = Math.max(...data.map(d => d.value));
    const yScale = chartHeight / maxValue;
    const xStep = chartWidth / (data.length - 1);

    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw area fill
    ctx.fillStyle = 'rgba(62, 95, 68, 0.1)';
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    data.forEach((point, index) => {
      const x = padding.left + index * xStep;
      const y = height - padding.bottom - point.value * yScale;
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(padding.left + (data.length - 1) * xStep, height - padding.bottom);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#3E5F44';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding.left + index * xStep;
      const y = height - padding.bottom - point.value * yScale;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    data.forEach((point, index) => {
      const x = padding.left + index * xStep;
      const y = height - padding.bottom - point.value * yScale;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#3E5F44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw x-axis labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    data.forEach((point, index) => {
      const x = padding.left + index * xStep;
      ctx.fillText(point.month, x, height - padding.bottom + 20);
    });

    // Draw y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxValue / 5) * (5 - i));
      const y = padding.top + (chartHeight / 5) * i;
      ctx.fillText(value.toString(), padding.left - 10, y);
    }

  }, [data]);

  return (
    <div className="w-full h-80">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
