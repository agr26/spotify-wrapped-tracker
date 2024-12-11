import React, { useState } from 'react';
import { Clock, Music, BarChart2, Disc, Calendar, 
         TrendingUp, History, Award, Sun, Moon } from 'lucide-react';
import { dummyListeningStats, dummyProjection, historicalData } from '../data/dummyData';
import { useNavigate } from 'react-router-dom';
import { spotifyLogout } from '../services/spotifyAuth';

// Reusable components
const ProgressBar = ({ current, max, color = "#1DB954", showPercentage = false }) => (
  <div className="w-full bg-[#404040] rounded-full h-2 mt-2">
    <div 
      className="h-2 rounded-full transition-all duration-300"
      style={{ 
        width: `${Math.min((current / max) * 100, 100)}%`,
        backgroundColor: color 
      }}
    />
    {showPercentage && (
      <div className="text-xs text-gray-400 mt-1">
        {Math.round((current / max) * 100)}%
      </div>
    )}
  </div>
);

const StatCard = ({ icon: Icon, value, label, subValue, trend }) => (
  <div className="bg-[#282828] p-6 rounded-xl shadow-lg hover:bg-[#2a2a2a] transition-all duration-300">
    <div className="text-center">
      <Icon className="w-8 h-8 mx-auto mb-3 text-[#1DB954]" />
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {subValue && (
        <div className="text-xs text-[#1DB954] mt-2 font-medium">{subValue}</div>
      )}
      {trend && (
        <div className={`text-xs mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last year
        </div>
      )}
    </div>
  </div>
);

function SpotifyStatsTracker() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFullList, setShowFullList] = useState(false);
  const [timeRange, setTimeRange] = useState('all');

  const renderTopItem = (item, index, type) => {
    const playsNeeded = type === 'tracks' ? 
      dummyProjection.playsNeededForChanges.tracks[item.name] :
      dummyProjection.playsNeededForChanges.artists[item.name];

    return (
      <div className="bg-[#2a2a2a] p-4 rounded-lg hover:bg-[#303030] transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-gray-400 mr-2">#{index + 1}</span>
            <span className="font-medium text-white">{item.name}</span>
            {type === 'tracks' && (
              <div className="text-sm text-gray-400">by {item.artist}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[#1DB954]">{item.playCount} plays</div>
            {playsNeeded && (
              <div className="text-xs text-gray-400">
                {playsNeeded} more plays for Top 5
              </div>
            )}
          </div>
        </div>
        <ProgressBar 
          current={item.playCount} 
          max={type === 'tracks' ? dummyListeningStats.topTracks[0].playCount : dummyListeningStats.topArtists[0].playCount}
        />
      </div>
    );
  };

  const renderGenreSection = () => (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">Genre Distribution</h3>
      <div className="space-y-4">
        {dummyListeningStats.genres.map((genre) => (
          <div key={genre.name} className="bg-[#2a2a2a] p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-white">{genre.name}</span>
              <span className="text-[#1DB954]">{genre.percentage}%</span>
            </div>
            <ProgressBar current={genre.percentage} max={100} />
            {genre.playsNeededForTop > 0 && (
              <div className="text-xs text-gray-400 mt-2">
                Need {genre.playsNeededForTop} more plays to become top genre
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );  

  const renderHistoricalComparison = () => (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">Year-Over-Year Comparison</h3>
      <div className="space-y-6">
        {Object.entries(historicalData.yearComparison).map(([year, data]) => (
          <div key={year} className="bg-[#2a2a2a] p-4 rounded-lg">
            <div className="text-lg font-medium text-white mb-2">{year}</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400">Minutes Listened</div>
                <div className="text-[#1DB954]">{Math.floor(data.totalMinutes / 60)}h</div>
              </div>
              <div>
                <div className="text-gray-400">Unique Artists</div>
                <div className="text-[#1DB954]">{data.uniqueArtists}</div>
              </div>
              <div>
                <div className="text-gray-400">Top Genre</div>
                <div className="text-white">{data.topGenres[0]}</div>
              </div>
              <div>
                <div className="text-gray-400">Top Artist</div>
                <div className="text-white">{data.topArtists[0]}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderListeningPatterns = () => (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">Listening Patterns</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg text-white mb-3">Weekday</h4>
          {Object.entries(historicalData.listeningPatterns.weekday).map(([time, data]) => (
            <div key={time} className="bg-[#2a2a2a] p-4 rounded-lg mb-3">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 capitalize">{time}</span>
                <span className="text-[#1DB954]">{data.percentage}%</span>
              </div>
              <div className="text-sm text-white">
                Top tracks: {data.favoriteTracks.join(', ')}
              </div>
            </div>
          ))}
        </div>
        <div>
          <h4 className="text-lg text-white mb-3">Weekend</h4>
          {Object.entries(historicalData.listeningPatterns.weekend).map(([time, data]) => (
            <div key={time} className="bg-[#2a2a2a] p-4 rounded-lg mb-3">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 capitalize">{time}</span>
                <span className="text-[#1DB954]">{data.percentage}%</span>
              </div>
              <div className="text-sm text-white">
                Top tracks: {data.favoriteTracks.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMilestones = () => (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">Milestones</h3>
      <div className="space-y-4">
        {historicalData.milestones.map((milestone, index) => (
          <div key={index} className="bg-[#2a2a2a] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-white font-medium">{milestone.title}</div>
                <div className="text-sm text-gray-400">{milestone.description}</div>
              </div>
              <Award className="w-6 h-6 text-[#1DB954]" />
            </div>
            <ProgressBar 
              current={milestone.current}
              max={milestone.target}
              showPercentage={true}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderProjectionsSection = () => (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">Year-End Projections</h3>
      <div className="space-y-4">
        <div className="flex justify-between p-3 bg-[#2a2a2a] rounded-lg">
          <span className="text-gray-400">Projected Total Time</span>
          <span className="text-[#1DB954]">{Math.floor(dummyProjection.estimatedMinutes / 60)}h</span>
        </div>
        <div className="flex justify-between p-3 bg-[#2a2a2a] rounded-lg">
          <span className="text-gray-400">Projected Artists</span>
          <span className="text-[#1DB954]">{dummyProjection.estimatedArtists}</span>
        </div>
        <div className="flex justify-between p-3 bg-[#2a2a2a] rounded-lg">
          <span className="text-gray-400">Projected Top Genre</span>
          <span className="text-[#1DB954]">{dummyProjection.projectedTopGenre}</span>
        </div>
        <div className="text-sm text-gray-400 mt-2">
          Based on your current listening habits and {dummyProjection.daysUntilWrapped} days until Wrapped
        </div>
      </div>
    </div>
  );  

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1DB954] to-[#179443] rounded-xl shadow-lg mb-6 p-8">
          <h1 className="text-3xl font-bold mb-2">Your 2024 Wrapped Progress</h1>
          <p className="text-lg opacity-90">
            {dummyProjection.daysUntilWrapped} days until Wrapped cutoff
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#282828] rounded-xl p-2 shadow-lg mb-6">
          <div className="flex flex-wrap gap-2">
            {['overview', 'top tracks', 'top artists', 'genres', 'history', 'patterns', 'milestones'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[#1DB954] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard 
                  icon={Clock}
                  value={`${Math.floor(dummyListeningStats.totalMinutes / 60)}h`}
                  label="Listening Time"
                  subValue={`Projected: ${Math.floor(dummyProjection.estimatedMinutes / 60)}h`}
                  trend={5}
                />
                <StatCard 
                  icon={Music}
                  value={dummyListeningStats.uniqueArtists}
                  label="Unique Artists"
                  subValue={`Projected: ${dummyProjection.estimatedArtists}`}
                  trend={8}
                />
                <StatCard 
                  icon={Disc}
                  value={dummyListeningStats.currentTopGenre}
                  label="Top Genre"
                  subValue={`Trending: ${dummyProjection.projectedTopGenre}`}
                />
              </div>
              {renderProjectionsSection()}
            </>
          )}

          {activeTab === 'top tracks' && (
            <div className="space-y-6">
              <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">Your Top Tracks</h3>
                <div className="space-y-4">
                  {dummyListeningStats.topTracks
                    .slice(0, showFullList ? undefined : 5)
                    .map((track, index) => renderTopItem(track, index, 'tracks'))}
                </div>
                <button
                  onClick={() => setShowFullList(!showFullList)}
                  className="mt-4 text-[#1DB954] hover:text-[#1ed760] transition-all"
                >
                  Show {showFullList ? 'less' : 'more'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'top artists' && (
            <div className="space-y-6">
              <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">Your Top Artists</h3>
                <div className="space-y-4">
                  {dummyListeningStats.topArtists
                    .slice(0, showFullList ? undefined : 5)
                    .map((artist, index) => renderTopItem(artist, index, 'artists'))}
                </div>
                <button
                  onClick={() => setShowFullList(!showFullList)}
                  className="mt-4 text-[#1DB954] hover:text-[#1ed760] transition-all"
                >
                  Show {showFullList ? 'less' : 'more'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'genres' && renderGenreSection()}
          {activeTab === 'history' && renderHistoricalComparison()}
          {activeTab === 'patterns' && renderListeningPatterns()}
          {activeTab === 'milestones' && renderMilestones()}
        </div>
      </div>
    </div>
  );
}

export default SpotifyStatsTracker;