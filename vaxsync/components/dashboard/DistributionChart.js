'use client';

import { useEffect, useRef } from 'react';

export default function DistributionChart({ data: chartData }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Use provided data or fallback to default
    const data = chartData || [
      { name: 'Barangay A', value: 35, color: '#3E5F44' },
      { name: 'Barangay B', value: 28, color: '#5E936C' },
      { name: 'Barangay C', value: 22, color: '#93DA97' },
      { name: 'Barangay D', value: 15, color: '#E8FFD7' }
    ];

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate center and radius
    const centerX = width / 3;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

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
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Draw legend
    const legendX = width * 0.6;
    const legendY = 40;
    const legendSpacing = 35;

    ctx.font = '14px Arial';
    data.forEach((segment, index) => {
      const y = legendY + index * legendSpacing;

      // Color box
      ctx.fillStyle = segment.color;
      ctx.fillRect(legendX, y - 10, 20, 20);

      // Text
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';
      ctx.fillText(`${segment.name}: ${segment.value}%`, legendX + 30, y + 5);
    });

  }, [chartData]);

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
