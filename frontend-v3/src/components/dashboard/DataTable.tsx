import React from 'react';
import { MoreHorizontal, Filter, ArrowUpDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  actions?: React.ReactNode;
}

const DataTable: React.FC<DataTableProps> = ({ 
  title, 
  columns, 
  data, 
  onRowClick,
  actions 
}) => {
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Open': 'badge-success',
      'Closed': 'badge-danger',
      'In Progress': 'badge-warning',
      'Shortlisted': 'badge-success',
      'Rejected': 'badge-danger',
      'Interviewed': 'badge-warning',
    };
    
    return (
      <span className={`${statusClasses[status as keyof typeof statusClasses] || 'badge-info'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
      <div className="p-6 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{title}</h3>
          <div className="flex items-center space-x-3">
            {actions}
            <button className="flex items-center space-x-2 px-3 py-2 border border-slate-300/50 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">Filter By</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <ArrowUpDown size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">Sort By: Recent</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-6 py-4 text-left">
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <ArrowUpDown size={14} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={index} 
                className={`table-row transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:shadow-lg ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4">
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
