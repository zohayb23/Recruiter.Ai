import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface SourceEffectivenessChartProps {
  startDate: Date;
  endDate: Date;
}

const SourceEffectivenessChart: React.FC<SourceEffectivenessChartProps> = ({ startDate, endDate }) => {
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
      labels: ['LinkedIn', 'Job Boards', 'Referrals', 'Company Website', 'Recruiters'],
      datasets: [
        {
          label: 'Applications',
          data: [150, 120, 80, 100, 50],
          backgroundColor: 'rgba(78, 115, 223, 0.8)',
        },
        {
          label: 'Quality Candidates',
          data: [75, 45, 60, 35, 30],
          backgroundColor: 'rgba(54, 185, 204, 0.8)',
        },
        {
          label: 'Hires',
          data: [15, 8, 12, 5, 6],
          backgroundColor: 'rgba(28, 200, 138, 0.8)',
        },
      ],
    };

    // Calculate conversion rates
    const conversionRates = data.labels.map((_, index) => {
      const applications = data.datasets[0].data[index];
      const hires = data.datasets[2].data[index];
      return ((hires / applications) * 100).toFixed(1);
    });

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
                afterBody: (context) => {
                  const dataIndex = context[0].dataIndex;
                  return `Conversion Rate: ${conversionRates[dataIndex]}%`;
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
                callback: (value) => value + '',
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

export default SourceEffectivenessChart; 