import React from 'react';
import { Clock, Music, Disc } from 'lucide-react';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';

const OverviewSection = ({ stats, predictions }) => {
  if (!stats || !stats.stats) return null;

  const minutesPerDay = stats.stats.totalMinutes ? Math.round(stats.stats.totalMinutes / 365) : 0;
  const hoursListened = stats.stats.totalMinutes ? Math.round(stats.stats.totalMinutes / 60) : 0;
  const projectedHours = predictions ? Math.round(predictions.estimatedMinutes / 60) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={Clock}
          value={`${hoursListened.toLocaleString()}h`}
          label="Hours Listened"
          subValue={`~${minutesPerDay} minutes per day`}
          trend={predictions ? ((projectedHours - hoursListened) / hoursListened * 100) : null}
        />
        <StatCard 
          icon={Music}
          value={(stats.stats.uniqueTracks || 0).toLocaleString()}
          label="Different Tracks"
          subValue="Unique songs played"
        />
        <StatCard 
          icon={Disc}
          value={(stats.stats.uniqueArtists || 0).toLocaleString()}
          label="Different Artists"
          subValue={predictions ? `Projected: ${predictions.estimatedArtists.toLocaleString()}` : undefined}
        />
      </div>
      
      {predictions && (
        <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Wrapped 2025 Progress</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Minutes Listened</span>
                <span className="text-[#1DB954]">
                  {(stats.stats.totalMinutes || 0).toLocaleString()} / {predictions.estimatedMinutes.toLocaleString()}
                </span>
              </div>
              <ProgressBar 
                current={stats.stats.totalMinutes || 0}
                max={predictions.estimatedMinutes}
                showPercentage
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Days Until Wrapped Cutoff</span>
                <span className="text-[#1DB954]">{predictions.daysUntilWrapped} days</span>
              </div>
              <ProgressBar 
                current={365 - predictions.daysUntilWrapped}
                max={365}
                showPercentage
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewSection;