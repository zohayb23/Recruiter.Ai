import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface TimeToHireChartProps {
  startDate: Date;
  endDate: Date;
}

const TimeToHireChart: React.FC<TimeToHireChartProps> = ({ startDate, endDate }) => {
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
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Average Time to Hire (Days)',
          data: [25, 28, 22, 20, 18, 23],
          borderColor: 'rgba(78, 115, 223, 1)',
          backgroundColor: 'rgba(78, 115, 223, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Target Time',
          data: [21, 21, 21, 21, 21, 21],
          borderColor: 'rgba(246, 194, 62, 1)',
          borderDash: [5, 5],
          fill: false,
          tension: 0,
        },
      ],
    };

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle',
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `${context.dataset.label}: ${context.raw} days`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
              ticks: {
                callback: (value) => value + ' days',
                stepSize: 5,
              },
            },
          },
          interaction: {
            intersect: false,
            mode: 'index',
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

export default TimeToHireChart; 