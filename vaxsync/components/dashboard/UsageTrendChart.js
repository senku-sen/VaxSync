'use client';

import { useEffect, useRef } from 'react';

export default function UsageTrendChart() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Sample data points (doses used per day)
    const data = [80, 95, 120, 110, 125, 115, 90, 105];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxValue = Math.max(...data) + 20;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate dimensions
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const pointSpacing = chartWidth / (data.length - 1);

    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw line chart
    ctx.strokeStyle = '#5E936C';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding + index * pointSpacing;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    data.forEach((value, index) => {
      const x = padding + index * pointSpacing;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;

      ctx.fillStyle = '#3E5F44';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    labels.forEach((label, index) => {
      const x = padding + index * pointSpacing;
      ctx.fillText(label, x, height - 15);
    });

    // Draw y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxValue / 4) * (4 - i));
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }

  }, []);

  return (
    <div className="w-full h-64">
      <canvas
        ref={canvasRef}
        width={600}
        height={256}
        className="w-full h-full"
      />
    </div>
  );
}
