'use client';

import { useEffect, useRef } from 'react';

export default function MonthlyTrendChart({ dateRange, selectedVaccine }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Sample data - would come from API based on filters
    const data = [85, 92, 110, 105, 130, 125, 145, 140, 160, 155, 175, 170];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const maxValue = Math.max(...data) + 30;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate dimensions
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const pointSpacing = chartWidth / (data.length - 1);

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

    // Draw area fill
    ctx.fillStyle = 'rgba(147, 218, 151, 0.2)';
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    
    data.forEach((value, index) => {
      const x = padding + index * pointSpacing;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line chart
    ctx.strokeStyle = '#3E5F44';
    ctx.lineWidth = 3;
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

      // Outer circle
      ctx.fillStyle = '#3E5F44';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Inner circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw x-axis labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    labels.forEach((label, index) => {
      const x = padding + index * pointSpacing;
      ctx.fillText(label, x, height - 20);
    });

    // Draw y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxValue / 5) * (5 - i));
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(value.toString(), padding - 15, y + 4);
    }

    // Draw axis titles
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Doses Used', 20, height / 2);
    
    ctx.textAlign = 'center';
    ctx.fillText('Month', width / 2, height - 5);

  }, [dateRange, selectedVaccine]);

  return (
    <div className="w-full h-80">
      <canvas
        ref={canvasRef}
        width={1000}
        height={320}
        className="w-full h-full"
      />
    </div>
  );
}
