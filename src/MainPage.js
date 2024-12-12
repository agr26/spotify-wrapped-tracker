import React, { useState, useEffect } from 'react';
import { Clock, Music, BarChart2, Disc, Calendar, TrendingUp, History } from 'lucide-react';

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

function MainPage({ token }) {
  const [userData, setUserData] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [audioFeatures, setAudioFeatures] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('medium_term');
  const [showFullList, setShowFullList] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token, timeRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [userDataResponse, topTracksResponse, topArtistsResponse, recentlyPlayedResponse, playlistsResponse] = await Promise.all([
        fetch('https://api.spotify.com/v1/me', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('https://api.spotify.com/v1/me/playlists', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const userData = await userDataResponse.json();
      const topTracks = await topTracksResponse.json();
      const topArtists = await topArtistsResponse.json();
      const recentlyPlayed = await recentlyPlayedResponse.json();
      const playlists = await playlistsResponse.json();

      setUserData(userData);
      setTopTracks(topTracks.items);
      setTopArtists(topArtists.items);
      setRecentlyPlayed(recentlyPlayed.items);
      setPlaylists(playlists.items);

      // Fetch audio features for top tracks
      const trackIds = topTracks.items.map(track => track.id).join(',');
      const audioFeaturesResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const audioFeaturesData = await audioFeaturesResponse.json();
      setAudioFeatures(audioFeaturesData.audio_features);

      // Generate predictions
      const predictedData = makePredictions(topTracks.items, topArtists.items, audioFeaturesData.audio_features);
      setPredictions(predictedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const makePredictions = (tracks, artists, audioFeatures) => {
    const predictedTopTracks = tracks.slice(0, 10).map((track, index) => ({
      ...track,
      predictedRank: index + 1,
    }));

    const predictedTopArtists = artists.slice(0, 10).map((artist, index) => ({
      ...artist,
      predictedRank: index + 1,
    }));

    const avgFeatures = audioFeatures.reduce((acc, features) => {
      Object.keys(features).forEach(key => {
        if (typeof features[key] === 'number') {
          acc[key] = (acc[key] || 0) + features[key] / audioFeatures.length;
        }
      });
      return acc;
    }, {});

    return { tracks: predictedTopTracks, artists: predictedTopArtists, avgFeatures };
  };

  const renderTopItem = (item, index, type) => (
    <div className="bg-[#2a2a2a] p-4 rounded-lg hover:bg-[#303030] transition-all duration-300">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-gray-400 mr-2">#{index + 1}</span>
          <span className="font-medium text-white">{item.name}</span>
          {type === 'tracks' && (
            <div className="text-sm text-gray-400">by {item.artists[0].name}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[#1DB954]">{item.popularity} popularity</div>
        </div>
      </div>
      <ProgressBar 
        current={item.popularity} 
        max={100}
      />
    </div>
  );

  const renderGenreSection = () => {
    if (!topArtists || topArtists.length === 0) {
      return <div>No genre data available</div>;
    }

    const genreCounts = topArtists
      .flatMap(artist => artist.genres)
      .reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {});

    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return (
      <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">Top Genres</h3>
        <div className="space-y-4">
          {sortedGenres.map(([genre, count]) => (
            <div key={genre} className="bg-[#2a2a2a] p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-white capitalize">{genre}</span>
                <span className="text-[#1DB954]">{count} artists</span>
              </div>
              <ProgressBar current={count} max={Math.max(...Object.values(genreCounts))} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecentlyPlayed = () => (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">Recently Played</h3>
      <div className="space-y-4">
        {recentlyPlayed.slice(0, 10).map((item, index) => (
          <div key={index} className="bg-[#2a2a2a] p-4 rounded-lg">
            <div className="text-white">{item.track.name} by {item.track.artists[0].name}</div>
            <div className="text-sm text-gray-400">Played at: {new Date(item.played_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPredictions = () => (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">Your 2024 Wrapped Predictions</h3>
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Predicted Top Tracks</h4>
        {predictions.tracks?.slice(0, 5).map((track, index) => renderTopItem(track, index, 'tracks'))}
        <h4 className="text-lg font-semibold text-white mt-6">Predicted Top Artists</h4>
        {predictions.artists?.slice(0, 5).map((artist, index) => renderTopItem(artist, index, 'artists'))}
        <h4 className="text-lg font-semibold text-white mt-6">Your Music Style</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(predictions.avgFeatures || {}).map(([feature, value]) => (
            <div key={feature} className="bg-[#1DB954] bg-opacity-20 p-2 rounded">
              <span className="text-white capitalize">{feature.replace('_', ' ')}: </span>
              <span className="text-[#1DB954] font-bold">{value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1DB954] to-[#179443] rounded-xl shadow-lg mb-6 p-8">
          <h1 className="text-3xl font-bold mb-2">Your Spotify Stats</h1>
          <p className="text-lg opacity-90">
            Based on your {timeRange === 'short_term' ? 'last 4 weeks' : timeRange === 'medium_term' ? 'last 6 months' : 'all time'} listening history
          </p>
        </div>

        {/* Time Range Selector */}
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

        {/* Navigation Tabs */}
        <div className="bg-[#282828] rounded-xl p-2 shadow-lg mb-6">
          <div className="flex flex-wrap gap-2">
            {['overview', 'top tracks', 'top artists', 'genres', 'recently played', 'predictions'].map((tab) => (
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
                  icon={Music}
                  value={topTracks.length}
                  label="Top Tracks"
                />
                <StatCard 
                  icon={Disc}
                  value={topArtists.length}
                  label="Top Artists"
                />
                <StatCard 
                  icon={Clock}
                  value={recentlyPlayed.length}
                  label="Recently Played Tracks"
                />
              </div>
              {renderPredictions()}
            </>
          )}

          {activeTab === 'top tracks' && (
            <div className="space-y-6">
              <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">Your Top Tracks</h3>
                <div className="space-y-4">
                  {topTracks
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
                  {topArtists
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
          {activeTab === 'recently played' && renderRecentlyPlayed()}
          {activeTab === 'predictions' && renderPredictions()}
        </div>
      </div>
    </div>
  );
}

export default MainPage;