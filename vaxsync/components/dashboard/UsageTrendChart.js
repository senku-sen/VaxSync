'use client';

import { useEffect, useRef, useState } from 'react';

export default function UsageTrendChart({ data }) {
  const canvasRef = useRef(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    // Reset animation
    setAnimationProgress(0);
    
    // Animate from 0 to 1 over 1.5 seconds
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [data]);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get actual canvas dimensions
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale everything down using CSS
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart dimensions
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find max value and add 20% padding for better visualization
    const maxValue = Math.max(...data.map(d => d.value));
    const yMax = Math.ceil(maxValue * 1.2);
    const yScale = chartHeight / yMax;
    const xStep = chartWidth / (data.length - 1);

    // Draw grid lines first
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Calculate how many points to draw based on animation progress
    const pointsToDraw = Math.ceil(data.length * animationProgress);
    
    // Draw area fill (gradient) with animation
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(147, 218, 151, 0.3)');
    gradient.addColorStop(1, 'rgba(147, 218, 151, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    
    for (let i = 0; i < pointsToDraw; i++) {
      const point = data[i];
      const x = padding + i * xStep;
      const y = height - padding - (point.value * yScale * animationProgress);
      ctx.lineTo(x, y);
    }
    
    if (pointsToDraw > 0) {
      const lastX = padding + (pointsToDraw - 1) * xStep;
      ctx.lineTo(lastX, height - padding);
    }
    ctx.closePath();
    ctx.fill();

    // Draw line with animation
    ctx.strokeStyle = '#3E5F44';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    for (let i = 0; i < pointsToDraw; i++) {
      const point = data[i];
      const x = padding + i * xStep;
      const y = height - padding - (point.value * yScale * animationProgress);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw points with animation (fade in and scale)
    for (let i = 0; i < pointsToDraw; i++) {
      const point = data[i];
      const x = padding + i * xStep;
      const y = height - padding - (point.value * yScale * animationProgress);
      
      // Calculate point-specific animation (stagger effect)
      const pointProgress = Math.max(0, Math.min(1, (animationProgress * data.length - i) / 2));
      const pointScale = pointProgress;
      const pointOpacity = pointProgress;
      
      if (pointOpacity > 0) {
        // Outer circle (white border)
        ctx.globalAlpha = pointOpacity;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, 6 * pointScale, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner circle (green)
        ctx.fillStyle = '#3E5F44';
        ctx.beginPath();
        ctx.arc(x, y, 4 * pointScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Draw Y-axis labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((yMax / 5) * (5 - i));
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(value.toString(), padding - 10, y);
    }
    
    // Draw X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.forEach((point, index) => {
      const x = padding + index * xStep;
      ctx.fillText(point.day, x, height - padding + 10);
    });

  }, [data, animationProgress]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '250px' }}
      className="w-full"
    />
  );
}
