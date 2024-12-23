import React, { useState, useEffect } from 'react';
import { 
  Clock, Music, BarChart2, Disc, Calendar, TrendingUp, 
  History, Upload, Star, Album, Sun, Moon, CloudRain 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { loadSpotifyData } from './spotifyDataLoader';
import { processStreamingHistory, predictWrapped } from './spotifyHistoryProcessor';

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

const StatCard = ({ icon: Icon, value, label, subValue, trend, onClick, isActive }) => (
  <div 
    onClick={onClick}
    className={`
      bg-[#282828] p-6 rounded-xl shadow-lg hover:bg-[#2a2a2a] transition-all duration-300
      ${onClick ? 'cursor-pointer' : ''}
      ${isActive ? 'border-2 border-[#1DB954]' : ''}
    `}
  >
    <div className="text-center">
      <Icon className="w-8 h-8 mx-auto mb-3 text-[#1DB954]" />
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {subValue && (
        <div className="text-xs text-[#1DB954] mt-2 font-medium">{subValue}</div>
      )}
      {trend && (
        <div className={`text-xs mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
        </div>
      )}
    </div>
  </div>
);

const MainPage = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState(null);
  const [wrappedPredictions, setWrappedPredictions] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [showFullList, setShowFullList] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('streams');
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        // Load and process data
        const rawData = loadSpotifyData();
        const processed = processStreamingHistory(rawData);
        setHistoricalData(processed);
        
        const predictions = predictWrapped(rawData);
        setWrappedPredictions(predictions);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getTimeRangeData = () => {
    if (!historicalData) return null;

    const now = new Date();
    const history = historicalData.rawHistory;

    switch (selectedTimeRange) {
      case '30days':
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        return history.filter(item => new Date(item.ts) >= thirtyDaysAgo);
      case '90days':
        const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
        return history.filter(item => new Date(item.ts) >= ninetyDaysAgo);
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return history.filter(item => new Date(item.ts) >= yearStart);
      default:
        return history;
    }
  };

  const renderOverviewSection = () => {
    if (!historicalData) return null;

    const stats = historicalData.stats;
    const trends = historicalData.trends;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={Clock}
            value={`${Math.round(stats.totalMinutes / 60)}h`}
            label="Total Listening Time"
            trend={trends.growth.minutes}
          />
          <StatCard 
            icon={Music}
            value={stats.uniqueTracks.toLocaleString()}
            label="Unique Tracks"
            trend={trends.growth.uniqueTracks}
          />
          <StatCard 
            icon={Disc}
            value={stats.uniqueArtists.toLocaleString()}
            label="Different Artists"
            trend={trends.growth.uniqueArtists}
          />
        </div>

        <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Listening Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg text-white mb-3">Time of Day</h4>
              <div className="space-y-3">
                {Object.entries(stats.timeOfDayDistribution).map(([time, count]) => (
                  <div key={time} className="bg-[#2a2a2a] p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white capitalize">{time}</span>
                      <span className="text-[#1DB954]">
                        {Math.round((count / stats.totalStreams) * 100)}%
                      </span>
                    </div>
                    <ProgressBar current={count} max={stats.totalStreams} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg text-white mb-3">Days of Week</h4>
              <div className="space-y-3">
                {Object.entries(stats.weekdayDistribution).map(([day, count]) => (
                  <div key={day} className="bg-[#2a2a2a] p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white">{day}</span>
                      <span className="text-[#1DB954]">
                        {Math.round((count / stats.totalStreams) * 100)}%
                      </span>
                    </div>
                    <ProgressBar current={count} max={stats.totalStreams} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {renderMonthlyTrends()}
      </div>
    );
  };

  const renderMonthlyTrends = () => {
    if (!historicalData?.monthlyStats) return null;

    const monthlyData = Object.entries(historicalData.monthlyStats)
      .map(([month, stats]) => ({
        month,
        streams: stats.streams,
        minutes: stats.minutes,
        uniqueTracks: stats.uniqueTracks,
        uniqueArtists: stats.uniqueArtists
      }))
      .slice(-12); // Get only last 12 months

    const metrics = {
      streams: { label: 'Streams', color: '#1DB954' },
      minutes: { label: 'Minutes', color: '#1ed760' },
      uniqueTracks: { label: 'Unique Tracks', color: '#169c46' },
      uniqueArtists: { label: 'Unique Artists', color: '#15803d' }
    };

    return (
      <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">Monthly Trends</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(metrics).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedMetric === key
                  ? 'bg-[#1DB954] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <XAxis 
                dataKey="month" 
                stroke="#fff"
                tick={{ fill: '#fff' }}
              />
              <YAxis 
                stroke="#fff"
                tick={{ fill: '#fff' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#282828',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={metrics[selectedMetric].color}
                strokeWidth={2}
                dot={{ fill: metrics[selectedMetric].color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderHistorySection = () => {
    if (!historicalData) return null;

    return (
      <div className="space-y-6">
        {/* Top Artists */}
        <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Top Artists</h3>
          <div className="space-y-4">
            {historicalData.stats.topArtists
              .slice(0, showFullList ? undefined : 10)
              .map((artist, index) => (
                <div key={artist.name} className="bg-[#2a2a2a] p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-400 mr-2">#{index + 1}</span>
                      <span className="font-medium text-white">{artist.name}</span>
                    </div>
                    <div className="text-[#1DB954]">
                      {artist.playCount.toLocaleString()} plays
                    </div>
                  </div>
                  <ProgressBar 
                    current={artist.playCount} 
                    max={historicalData.stats.topArtists[0].playCount} 
                  />
                </div>
              ))}
            {historicalData.stats.topArtists.length > 10 && (
              <button
                onClick={() => setShowFullList(!showFullList)}
                className="mt-4 text-[#1DB954] hover:text-[#1ed760] transition-all"
              >
                Show {showFullList ? 'less' : 'more'}
              </button>
            )}
          </div>
        </div>

        {/* Top Tracks */}
        <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Top Tracks</h3>
          <div className="space-y-4">
            {historicalData.stats.topTracks
              .slice(0, showFullList ? undefined : 10)
              .map((track, index) => (
                <div key={track.name} className="bg-[#2a2a2a] p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-400 mr-2">#{index + 1}</span>
                      <span className="font-medium text-white">{track.name}</span>
                    </div>
                    <div className="text-[#1DB954]">
                      {track.playCount.toLocaleString()} plays
                    </div>
                  </div>
                  <ProgressBar 
                    current={track.playCount} 
                    max={historicalData.stats.topTracks[0].playCount} 
                  />
                </div>
              ))}
            {historicalData.stats.topTracks.length > 10 && (
              <button
                onClick={() => setShowFullList(!showFullList)}
                className="mt-4 text-[#1DB954] hover:text-[#1ed760] transition-all"
              >
                Show {showFullList ? 'less' : 'more'}
              </button>
            )}
          </div>
        </div>

        {/* Top Albums */}
        <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Top Albums</h3>
          <div className="space-y-4">
            {historicalData.stats.topAlbums
              .slice(0, showFullList ? undefined : 10)
              .map((album, index) => (
                <div key={album.name} className="bg-[#2a2a2a] p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-400 mr-2">#{index + 1}</span>
                      <span className="font-medium text-white">{album.name}</span>
                    </div>
                    <div className="text-[#1DB954]">
                      {album.playCount.toLocaleString()} plays
                    </div>
                  </div>
                  <ProgressBar 
                    current={album.playCount} 
                    max={historicalData.stats.topAlbums[0].playCount} 
                  />
                </div>
              ))}
            {historicalData.stats.topAlbums.length > 10 && (
              <button
                onClick={() => setShowFullList(!showFullList)}
                className="mt-4 text-[#1DB954] hover:text-[#1ed760] transition-all"
              >
                Show {showFullList ? 'less' : 'more'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPredictionsSection = () => {
    if (!wrappedPredictions) return null;

    return (
      <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">Your 2024 Wrapped Predictions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Current Progress</h4>
            <div className="space-y-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white">Minutes Listened</span>
                  <span className="text-[#1DB954]">
                    {wrappedPredictions.currentStats.totalMinutes.toLocaleString()}
                  </span>
                </div>
                <ProgressBar 
                  current={wrappedPredictions.currentStats.totalMinutes} 
                  max={wrappedPredictions.projectedMinutes}
                  showPercentage
                />
              </div>
              
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white">Total Streams</span>
                  <span className="text-[#1DB954]">
                    {wrappedPredictions.currentStats.totalStreams.toLocaleString()}
                  </span>
                </div>
                <ProgressBar 
                  current={wrappedPredictions.currentStats.totalStreams} 
                  max={wrappedPredictions.projectedStreams}
                  showPercentage
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Projected Final Stats</h4>
            <div className="space-y-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="text-white mb-2">Estimated Final Minutes</div>
                <div className="text-3xl font-bold text-[#1DB954]">
                  {wrappedPredictions.projectedMinutes.toLocaleString()}
                </div>
              </div>
              
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="text-white mb-2">Estimated Final Streams</div>
                <div className="text-3xl font-bold text-[#1DB954]">
                  {wrappedPredictions.projectedStreams.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#2a2a2a] p-4 rounded-lg mt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400">Days until Wrapped cutoff</div>
              <div className="text-2xl font-bold text-white">
                {wrappedPredictions.daysUntilWrapped}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400">Cutoff Date</div>
              <div className="text-white">
                {new Date(wrappedPredictions.wrappedCutoffDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading your Spotify data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl text-red-500">Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1DB954] to-[#179443] rounded-xl shadow-lg mb-6 p-8">
          <h1 className="text-3xl font-bold mb-2">Your Spotify Stats & Predictions</h1>
          <p className="text-lg opacity-90">
            Based on your complete streaming history
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-[#282828] text-white p-2 rounded"
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="90days">Last 90 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#282828] rounded-xl p-2 shadow-lg mb-6">
          <div className="flex flex-wrap gap-2">
            {['overview', 'history', 'predictions'].map((tab) => (
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

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && renderOverviewSection()}
          {activeTab === 'history' && renderHistorySection()}
          {activeTab === 'predictions' && renderPredictionsSection()}
        </div>
      </div>
    </div>
  );
};

export default MainPage;