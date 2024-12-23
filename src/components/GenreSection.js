import React from 'react';
import ProgressBar from './ProgressBar';

const GenreSection = ({ artists, enhanced, historicalGenres }) => {
  const genreCounts = artists
    .flatMap(artist => artist.genres || [])
    .reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

  const sortedGenres = Object.entries(genreCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const maxCount = Math.max(...Object.values(genreCounts));

  return (
    <div className="space-y-6">
      <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">Current Top Genres</h3>
        <div className="space-y-4">
          {sortedGenres.map(([genre, count]) => (
            <div key={genre} className="bg-[#2a2a2a] p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-white capitalize">{genre}</span>
                <span className="text-[#1DB954]">{count} artists</span>
              </div>
              <ProgressBar 
                current={count}
                max={maxCount}
              />
            </div>
          ))}
        </div>
      </div>

      {enhanced && historicalGenres && (
        <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Genre Evolution</h3>
          <div className="space-y-4">
            {historicalGenres.map((genre, index) => (
              <div key={index} className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-white capitalize">{genre.name}</span>
                  <span className="text-[#1DB954]">{genre.percentage}%</span>
                </div>
                <ProgressBar 
                  current={genre.percentage}
                  max={100}
                  showPercentage
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenreSection;