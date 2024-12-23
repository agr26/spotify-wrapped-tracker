import React from 'react';

const ProgressBar = ({ current, max, color = "#1DB954", showPercentage = false }) => {
  const percentage = Math.min((current / max) * 100, 100);
  
  return (
    <div className="w-full space-y-1">
      <div className="bg-[#404040] rounded-full h-2">
        <div 
          className="h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color 
          }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-gray-400">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;