'use client';

import { useEffect, useRef } from 'react';

export default function BarangayComparisonChart({ selectedBarangay }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Sample data
    const data = [
      { name: 'Barangay A', value: 450, color: '#3E5F44' },
      { name: 'Barangay B', value: 380, color: '#5E936C' },
      { name: 'Barangay C', value: 520, color: '#93DA97' },
      { name: 'Barangay D', value: 290, color: '#E8FFD7' }
    ];

    const maxValue = Math.max(...data.map(d => d.value)) + 100;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate dimensions
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / data.length - 20;
    const barSpacing = chartWidth / data.length;

    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = padding + index * barSpacing + 10;
      const y = height - padding - barHeight;

      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(x, y, x, height - padding);
      gradient.addColorStop(0, item.color);
      gradient.addColorStop(1, item.color + '80');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 10);

      // Draw label below bar
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, x + barWidth / 2, height - padding + 20);
    });

    // Draw y-axis labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxValue / 5) * (5 - i));
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(value.toString(), padding - 15, y + 4);
    }

    // Draw axis title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Doses Used', 0, 0);
    ctx.restore();

  }, [selectedBarangay]);

  return (
    <div className="w-full h-80">
      <canvas
        ref={canvasRef}
        width={600}
        height={320}
        className="w-full h-full"
      />
    </div>
  );
}
