import React from 'react';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/50 border-b border-slate-200/50 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{title}</h1>
            {subtitle && (
              <p className="text-slate-600 text-sm mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-lg">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg"></span>
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-200/50">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">John Smith</p>
              <p className="text-xs text-slate-500">IT Recruiter</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
              <span className="text-white font-medium text-sm">JS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
