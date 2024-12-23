import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import ProgressBar from './ProgressBar';

const PredictionsSection = ({ predictions, stats, enhanced = false }) => {
  if (!predictions || !stats || !stats.stats) return null;

  return (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">
        Your 2025 Wrapped Predictions
        {enhanced && (
          <span className="ml-2 text-sm text-green-500">Enhanced accuracy</span>
        )}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Current Stats</h4>
          <div className="bg-[#2a2a2a] p-4 rounded-lg">
            <div className="space-y-3">
              <div>
                <span className="text-gray-400">Minutes Listened:</span>
                <span className="text-white float-right">
                  {(stats.stats.totalMinutes || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Unique Artists:</span>
                <span className="text-white float-right">
                  {(stats.stats.uniqueArtists || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Unique Tracks:</span>
                <span className="text-white float-right">
                  {(stats.stats.uniqueTracks || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Projected Final Stats</h4>
          <div className="bg-[#2a2a2a] p-4 rounded-lg">
            <div className="space-y-3">
              <div>
                <span className="text-gray-400">Estimated Minutes:</span>
                <span className="text-white float-right">
                  {(predictions.estimatedMinutes || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Estimated Artists:</span>
                <span className="text-white float-right">
                  {(predictions.estimatedArtists || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {enhanced && predictions.playsNeededForChanges && (
        <>
          <div className="space-y-4 mb-6">
            <h4 className="text-lg font-semibold text-white">Tracks Needing Plays for Top 5</h4>
            {Object.entries(predictions.playsNeededForChanges.tracks || {}).map(([track, plays]) => (
              <div key={track} className="bg-[#2a2a2a] p-3 rounded-lg">
                <span className="text-white">{track}</span>
                <span className="text-[#1DB954] float-right">{plays} plays needed</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Artists Needing Plays for Top 5</h4>
            {Object.entries(predictions.playsNeededForChanges.artists || {}).map(([artist, plays]) => (
              <div key={artist} className="bg-[#2a2a2a] p-3 rounded-lg">
                <span className="text-white">{artist}</span>
                <span className="text-[#1DB954] float-right">{plays} plays needed</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 p-4 bg-[#2a2a2a] rounded-lg">
        <div className="text-white mb-2">
          <Calendar className="inline-block w-5 h-5 mr-2 text-[#1DB954]" />
          Wrapped Cutoff: {predictions.wrappedCutoffDate ? new Date(predictions.wrappedCutoffDate).toLocaleDateString() : 'N/A'}
        </div>
        <div className="text-white">
          <TrendingUp className="inline-block w-5 h-5 mr-2 text-[#1DB954]" />
          Days Remaining: {predictions.daysUntilWrapped || 0}
        </div>
      </div>
    </div>
  );
};

export default PredictionsSection;