import React from 'react';
import type { MarginPool } from '../../types/lending';

interface UtilizationCurveProps {
  pool: MarginPool;
}

export function UtilizationCurve({ pool }: UtilizationCurveProps) {
  // Recreate the Move interest rate calculation
  const calculateInterestRate = (utilizationRate: number): number => {
    const baseRate = parseFloat(pool.base_rate);
    const baseSlope = parseFloat(pool.base_slope);
    const optimalUtilization = parseFloat(pool.optimal_utilization);
    const excessSlope = parseFloat(pool.excess_slope);

    if (utilizationRate < optimalUtilization) {
      // Use base slope
      return utilizationRate * baseSlope + baseRate;
    } else {
      // Use base slope and excess slope
      const excessUtilization = utilizationRate - optimalUtilization;
      const excessRate = excessUtilization * excessSlope;
      
      return baseRate + (optimalUtilization * baseSlope) + excessRate;
    }
  };

  // Generate curve data points
  const generateCurveData = () => {
    const points = [];
    for (let i = 0; i <= 100; i += 5) {
      const utilization = i / 100;
      const rate = calculateInterestRate(utilization);
      points.push({
        utilization: i,
        rate: rate * 100, // Convert to percentage
        isCurrent: Math.abs(i - parseFloat(pool.utilization_rate) * 100) < 2.5
      });
    }
    return points;
  };

  const curveData = generateCurveData();
  const currentUtilization = parseFloat(pool.utilization_rate) * 100;
  const currentRate = parseFloat(pool.current_rate || '0') * 100;

  return (
    <div className="space-y-4">
      {/* Curve Labels */}
      <div className="flex justify-between text-xs text-gray-600">
        <span>Base: {(parseFloat(pool.base_rate) * 100).toFixed(2)}%</span>
        <span>Opt: {(parseFloat(pool.optimal_utilization) * 100).toFixed(1)}%</span>
        <span>Max: 100%</span>
      </div>

      {/* Curve Visualization */}
      <div className="relative h-20 bg-gray-50 rounded-lg p-2">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 50, 100].map((tick) => (
            <div key={tick} className="w-full h-px bg-gray-200" />
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
          {[0, 50, 100].map((tick) => (
            <span key={tick} className="transform -translate-y-1/2">
              {tick}%
            </span>
          ))}
        </div>

        {/* Curve path */}
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          
          <path
            d={curveData.map((point, index) => {
              const x = point.utilization;
              const y = 100 - Math.min(point.rate, 100); // Invert Y for SVG
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            stroke="url(#curveGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Current utilization indicator */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-blue-600 rounded-full"
          style={{ left: `${currentUtilization}%` }}
        />
        
        {/* Current point label */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-full"
          style={{ 
            left: `${currentUtilization}%`,
            top: `${100 - Math.min(currentRate, 100)}%`
          }}
        >
          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {currentUtilization.toFixed(1)}% util
            <br />
            {currentRate.toFixed(2)}% rate
          </div>
        </div>
      </div>

      {/* Curve explanation */}
      <div className="text-xs text-gray-600 flex justify-between">
        <span><strong>Base:</strong> {(parseFloat(pool.base_rate) * 100).toFixed(2)}%</span>
        <span><strong>Slope:</strong> {(parseFloat(pool.base_slope) * 100).toFixed(2)}%</span>
        <span><strong>Excess:</strong> {(parseFloat(pool.excess_slope) * 100).toFixed(2)}%</span>
      </div>
    </div>
  );
}
