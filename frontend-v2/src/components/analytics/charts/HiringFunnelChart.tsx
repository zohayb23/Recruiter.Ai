import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface HiringFunnelChartProps {
  startDate: Date;
  endDate: Date;
}

const HiringFunnelChart: React.FC<HiringFunnelChartProps> = ({ startDate, endDate }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Sample data - replace with actual API data
    const data = {
      labels: ['Applications', 'Screened', 'Interviewed', 'Offered', 'Hired'],
      datasets: [
        {
          label: 'Candidates',
          data: [500, 350, 200, 50, 30],
          backgroundColor: [
            'rgba(78, 115, 223, 0.8)',
            'rgba(54, 185, 204, 0.8)',
            'rgba(246, 194, 62, 0.8)',
            'rgba(28, 200, 138, 0.8)',
            'rgba(133, 135, 150, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw as number;
                  const total = data.datasets[0].data[0] as number;
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${value} candidates (${percentage}%)`;
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                display: false,
              },
            },
            y: {
              grid: {
                display: false,
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [startDate, endDate]);

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default HiringFunnelChart; 