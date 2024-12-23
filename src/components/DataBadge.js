import React from 'react';

const DataBadge = ({ source, className = '' }) => (
  <span className={`
    px-3 py-1 rounded-full text-sm
    ${source === 'combined' 
      ? 'bg-green-500 text-white' 
      : 'bg-yellow-500 text-black'}
    ${className}
  `}>
    {source === 'combined' 
      ? '✓ Enhanced with historical data' 
      : 'Basic predictions (upload history to enhance)'}
  </span>
);

export default DataBadge;