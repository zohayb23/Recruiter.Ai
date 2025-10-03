import React from 'react';
import { HelpCircle } from 'lucide-react';
import Tooltip from './Tooltip';

interface HelpTextProps {
  text: string;
  className?: string;
}

const HelpText: React.FC<HelpTextProps> = ({ text, className = '' }) => {
  return (
    <Tooltip content={text} position="top" delay={100}>
      <HelpCircle 
        size={16} 
        className={`text-gray-400 hover:text-gray-600 cursor-help transition-colors ${className}`}
      />
    </Tooltip>
  );
};

export default HelpText;
