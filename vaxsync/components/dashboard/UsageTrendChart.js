'use client';

import { useEffect, useRef } from 'react';

export default function UsageTrendChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart dimensions
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find max value
    const maxValue = Math.max(...data.map(d => d.value));
    const yScale = chartHeight / maxValue;
    const xStep = chartWidth / (data.length - 1);

    // Draw axes
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw area fill
    ctx.fillStyle = 'rgba(147, 218, 151, 0.1)';
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    data.forEach((point, index) => {
      const x = padding + index * xStep;
      const y = height - padding - point.value * yScale;
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(padding + (data.length - 1) * xStep, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#5E936C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + index * xStep;
      const y = height - padding - point.value * yScale;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    data.forEach((point, index) => {
      const x = padding + index * xStep;
      const y = height - padding - point.value * yScale;
      
      ctx.fillStyle = '#5E936C';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    // X-axis labels
    data.forEach((point, index) => {
      const x = padding + index * xStep;
      ctx.fillText(point.day, x, height - padding + 20);
    });

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxValue / 4) * (4 - i));
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(value.toString(), padding - 10, y + 5);
    }

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={250}
      className="w-full h-64"
    />
  );
}
