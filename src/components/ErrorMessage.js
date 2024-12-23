import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, className = '' }) => (
  <div className={`
    bg-red-500 bg-opacity-10 border border-red-500 
    rounded-lg p-4 flex items-center gap-3
    ${className}
  `}>
    <AlertCircle className="w-6 h-6 text-red-500" />
    <span className="text-red-500">{message}</span>
  </div>
);

export default ErrorMessage;