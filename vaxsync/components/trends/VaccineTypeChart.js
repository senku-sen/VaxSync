'use client';

import { useEffect, useRef } from 'react';

export default function VaccineTypeChart({ selectedBarangay }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Sample data
    const data = [
      { name: 'COVID-19', value: 35, color: '#3E5F44' },
      { name: 'Polio', value: 25, color: '#5E936C' },
      { name: 'Measles', value: 20, color: '#93DA97' },
      { name: 'Hepatitis B', value: 15, color: '#C8E6C9' },
      { name: 'Others', value: 5, color: '#E8FFD7' }
    ];

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate center and radius
    const centerX = width / 3;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 30;

    // Draw pie chart
    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach((segment) => {
      const sliceAngle = (segment.value / 100) * 2 * Math.PI;

      // Draw slice
      ctx.fillStyle = segment.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw percentage on slice
      const midAngle = currentAngle + sliceAngle / 2;
      const textX = centerX + (radius * 0.6) * Math.cos(midAngle);
      const textY = centerY + (radius * 0.6) * Math.sin(midAngle);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${segment.value}%`, textX, textY);

      currentAngle += sliceAngle;
    });

    // Draw legend
    const legendX = width * 0.62;
    const legendY = 50;
    const legendSpacing = 40;

    ctx.font = '14px Arial';
    data.forEach((segment, index) => {
      const y = legendY + index * legendSpacing;

      // Color box
      ctx.fillStyle = segment.color;
      ctx.fillRect(legendX, y - 12, 24, 24);

      // Border for color box
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX, y - 12, 24, 24);

      // Text
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(segment.name, legendX + 35, y);
      
      // Percentage
      ctx.fillStyle = '#6B7280';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${segment.value}%`, width - 20, y);
    });

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
