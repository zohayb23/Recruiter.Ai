import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface RecruiterMetricsChartProps {
  startDate: Date;
  endDate: Date;
}

const RecruiterMetricsChart: React.FC<RecruiterMetricsChartProps> = ({ startDate, endDate }) => {
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
      labels: ['Sarah Wilson', 'John Smith', 'Emily Brown', 'Michael Lee'],
      datasets: [
        {
          label: 'Candidates Screened',
          data: [45, 38, 42, 35],
          backgroundColor: 'rgba(78, 115, 223, 0.8)',
          borderWidth: 1,
        },
        {
          label: 'Interviews Conducted',
          data: [28, 22, 25, 20],
          backgroundColor: 'rgba(54, 185, 204, 0.8)',
          borderWidth: 1,
        },
        {
          label: 'Offers Extended',
          data: [8, 6, 7, 5],
          backgroundColor: 'rgba(28, 200, 138, 0.8)',
          borderWidth: 1,
        },
        {
          label: 'Hires',
          data: [5, 4, 4, 3],
          backgroundColor: 'rgba(246, 194, 62, 0.8)',
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
                  return `${context.dataset.label}: ${context.raw}`;
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
                stepSize: 10,
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

export default RecruiterMetricsChart; 