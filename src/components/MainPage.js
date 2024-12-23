import React, { useState, useEffect } from 'react';
import { Clock, Music, Disc, BarChart2, Calendar, TrendingUp, History } from 'lucide-react';
import processedHistoryData from '../utils/spotifyData';
import { generatePredictions } from '../utils/predictions';
import OverviewSection from './OverviewSection';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';
import TopItemsSection from './TopItemsSection';
import GenreSection from './GenreSection';
import PredictionsSection from './PredictionsSection';

function MainPage({ token }) {
  // State for data sources
  const [apiData, setApiData] = useState(null);
  const [combinedStats, setCombinedStats] = useState(null);
  
  // State for Spotify API data
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [predictions, setPredictions] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('medium_term');
  const [showFullList, setShowFullList] = useState(false);

  useEffect(() => {
    if (token) {
      fetchSpotifyData();
    }
  }, [token, timeRange]);

  useEffect(() => {
    if (apiData) {
      const processed = {
        ...processedHistoryData,
        recentlyPlayed: apiData.recentlyPlayed,
        currentTopTracks: apiData.topTracks,
        currentTopArtists: apiData.topArtists
      };
      
      setCombinedStats(processed);
      setPredictions(generatePredictions(processed));
    }
  }, [apiData]);

  const fetchSpotifyData = async () => {
    setLoading(true);
    try {
      const [topTracksResponse, topArtistsResponse, recentlyPlayedResponse] = await Promise.all([
        fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
      ]);

      const [topTracks, topArtists, recentlyPlayed] = await Promise.all([
        topTracksResponse.json(),
        topArtistsResponse.json(),
        recentlyPlayedResponse.json()
      ]);

      setTopTracks(topTracks.items);
      setTopArtists(topArtists.items);
      setRecentlyPlayed(recentlyPlayed.items);

      setApiData({
        topTracks: topTracks.items,
        topArtists: topArtists.items,
        recentlyPlayed: recentlyPlayed.items
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading your Spotify data...</div>
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
            Based on your {timeRange === 'short_term' ? 'last 4 weeks' : 
              timeRange === 'medium_term' ? 'last 6 months' : 'all time'} listening history
          </p>
        </div>

        {/* Time Range Selector */}
        {activeTab !== 'history' && (
          <div className="mb-6">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#282828] text-white p-2 rounded"
            >
              <option value="short_term">Last 4 Weeks</option>
              <option value="medium_term">Last 6 Months</option>
              <option value="long_term">All Time</option>
            </select>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-[#282828] rounded-xl p-2 shadow-lg mb-6">
          <div className="flex flex-wrap gap-2">
            {['overview', 'top tracks', 'top artists', 'genres', 'history', 'predictions'].map((tab) => (
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
            <OverviewSection 
            stats={combinedStats ? {
              stats: {
                totalMinutes: combinedStats.stats.totalMinutes || 0,
                uniqueTracks: combinedStats.stats.uniqueTracks || 0,
                uniqueArtists: combinedStats.stats.uniqueArtists || 0
              }
            } : null} 
            predictions={predictions}
            />
          )}

          {activeTab === 'top tracks' && (
            <TopItemsSection 
              items={combinedStats?.stats.topTracks || []}
              type="tracks"
              showFullList={showFullList}
              setShowFullList={setShowFullList}
            />
          )}

          {activeTab === 'top artists' && (
            <TopItemsSection 
              items={combinedStats?.stats.topArtists || []}
              type="artists"
              showFullList={showFullList}
              setShowFullList={setShowFullList}
            />
          )}

          {activeTab === 'genres' && (
            <GenreSection 
              artists={topArtists}
              historicalData={processedHistoryData}
            />
          )}

          {activeTab === 'history' && (
            <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">Your Listening History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                  icon={Clock}
                  value={`${Math.round(processedHistoryData.stats.totalMinutes / 60).toLocaleString()}h`}
                  label="Total Listening Time"
                  subValue={`${processedHistoryData.stats.totalMinutes.toLocaleString()} minutes`}
                />
                <StatCard 
                  icon={Music}
                  value={processedHistoryData.stats.uniqueTracks.toLocaleString()}
                  label="Unique Tracks"
                  subValue={`${processedHistoryData.stats.totalStreams.toLocaleString()} total plays`}
                />
                <StatCard 
                  icon={Disc}
                  value={processedHistoryData.stats.uniqueArtists.toLocaleString()}
                  label="Different Artists"
                />
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-4">Time of Day Distribution</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(processedHistoryData.stats.timeOfDayDistribution).map(([time, count]) => (
                    <div key={time} className="bg-[#2a2a2a] p-4 rounded-lg">
                      <div className="capitalize text-gray-400">{time}</div>
                      <div className="text-xl font-bold text-white">
                        {Math.round(count / processedHistoryData.stats.totalStreams * 100)}%
                      </div>
                      <ProgressBar 
                        current={count}
                        max={Math.max(...Object.values(processedHistoryData.stats.timeOfDayDistribution))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-4">Yearly Overview</h4>
                <div className="space-y-4">
                  {Object.entries(processedHistoryData.yearlyStats).map(([year, stats]) => (
                    <div key={year} className="bg-[#2a2a2a] p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{year}</span>
                        <span className="text-[#1DB954]">
                          {Math.round(stats.totalMinutes / 60).toLocaleString()}h played
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-400">
                          Tracks: {stats.uniqueTracks.toLocaleString()}
                        </div>
                        <div className="text-gray-400">
                          Artists: {stats.uniqueArtists.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && predictions && (
            <PredictionsSection 
            predictions={predictions}
            stats={combinedStats ? {
              stats: {
                totalMinutes: combinedStats.stats.totalMinutes || 0,
                uniqueTracks: combinedStats.stats.uniqueTracks || 0,
                uniqueArtists: combinedStats.stats.uniqueArtists || 0
              }
            } : null}
            enhanced={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default MainPage;