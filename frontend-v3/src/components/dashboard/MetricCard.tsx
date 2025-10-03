import React from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'purple';
  trend?: {
    data: number[];
    color: string;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  color,
  trend 
}) => {
  const colorClasses = {
    primary: 'border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50',
    success: 'border-green-200/50 bg-gradient-to-br from-green-50 to-emerald-50',
    warning: 'border-yellow-200/50 bg-gradient-to-br from-yellow-50 to-amber-50',
    danger: 'border-red-200/50 bg-gradient-to-br from-red-50 to-pink-50',
    purple: 'border-purple-200/50 bg-gradient-to-br from-purple-50 to-violet-50',
  };

  const iconColorClasses = {
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border-2 ${colorClasses[color]} p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          
          {change && (
            <div className="flex items-center space-x-1">
              {change.type === 'increase' ? (
                <TrendingUp size={16} className="text-success-500" />
              ) : (
                <TrendingDown size={16} className="text-danger-500" />
              )}
              <span className={`text-sm font-medium ${
                change.type === 'increase' ? 'text-success-600' : 'text-danger-600'
              }`}>
                {change.value}% from {change.period}
              </span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-lg bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-sm shadow-lg ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
      
      {/* Mini Trend Chart */}
      {trend && (
        <div className="mt-4 h-12 flex items-end space-x-1">
          {trend.data.map((point, index) => (
            <div
              key={index}
              className="flex-1 bg-gray-200 rounded-t"
              style={{
                height: `${(point / Math.max(...trend.data)) * 100}%`,
                backgroundColor: trend.color,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
