import React from 'react';
import ProgressBar from './ProgressBar';

const TopItemsSection = ({ items, type, showFullList, setShowFullList, enhanced }) => {
  const renderItem = (item, index) => (
    <div key={item.id} className="bg-[#2a2a2a] p-4 rounded-lg hover:bg-[#303030] transition-all duration-300">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-gray-400 mr-2">#{index + 1}</span>
          <span className="font-medium text-white">{item.name}</span>
          {type === 'tracks' && (
            <div className="text-sm text-gray-400">
              by {item.artists?.[0]?.name || item.artist}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[#1DB954]">
            {enhanced ? `${item.playCount} plays` : `${item.popularity}% popularity`}
          </div>
          {enhanced && item.playsNeededForTop5 > 0 && (
            <div className="text-xs text-gray-400">
              {item.playsNeededForTop5} plays to Top 5
            </div>
          )}
        </div>
      </div>
      <ProgressBar 
        current={enhanced ? item.playCount : item.popularity}
        max={enhanced ? 
          Math.max(...items.map(i => i.playCount)) :
          100
        }
      />
    </div>
  );

  return (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">
        Your Top {type === 'tracks' ? 'Tracks' : 'Artists'}
      </h3>
      <div className="space-y-4">
        {items
          .slice(0, showFullList ? undefined : 10)
          .map((item, index) => renderItem(item, index))}
      </div>
      {items.length > 10 && (
        <button
          onClick={() => setShowFullList(!showFullList)}
          className="mt-4 text-[#1DB954] hover:text-[#1ed760] transition-all"
        >
          Show {showFullList ? 'less' : 'more'}
        </button>
      )}
    </div>
  );
};

export default TopItemsSection;