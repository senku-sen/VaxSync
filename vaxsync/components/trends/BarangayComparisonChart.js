'use client';

import { useEffect, useRef } from 'react';

export default function BarangayComparisonChart({ data }) {
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
    const padding = { top: 20, right: 20, bottom: 60, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...data.map(d => d.value));
    const yScale = chartHeight / maxValue;
    const barWidth = chartWidth / data.length - 20;
    const barSpacing = chartWidth / data.length;

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

    // Draw bars
    data.forEach((item, index) => {
      const x = padding.left + index * barSpacing + 10;
      const barHeight = item.value * yScale;
      const y = height - padding.bottom - barHeight;

      // Gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, item.color);
      gradient.addColorStop(1, item.color + '80');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Bar border
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Value on top of bar
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 10);

      // Label below bar
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      const words = item.name.split(' ');
      words.forEach((word, wordIndex) => {
        ctx.fillText(word, x + barWidth / 2, height - padding.bottom + 20 + wordIndex * 15);
      });
    });

    // Draw y-axis labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px sans-serif';
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
