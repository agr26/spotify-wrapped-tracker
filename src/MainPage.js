import React, { useState, useEffect } from 'react';
import { Clock, Music, BarChart2, Disc, Calendar, TrendingUp, History, Upload } from 'lucide-react';
import HistoryUploader from './HistoryUploader';

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
  // State for Spotify API data
  const [userData, setUserData] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [audioFeatures, setAudioFeatures] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  
  // State for historical data
  const [historicalData, setHistoricalData] = useState(null);
  
  // State for analysis
  const [listeningStats, setListeningStats] = useState(null);
  const [predictions, setPredictions] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('medium_term');
  const [showFullList, setShowFullList] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token, timeRange]);

  const processListeningStats = (tracks, artists, recentTracks) => {
    // Calculate total listening time (estimated from recent tracks)
    const averageTrackDuration = tracks?.reduce((acc, track) => acc + (track.duration_ms || 0), 0) / (tracks?.length || 1);
    const estimatedTotalMinutes = Math.round((recentTracks?.length || 0) * averageTrackDuration / (1000 * 60));

    // Process genres
    const genreCounts = {};
    artists?.forEach(artist => {
      artist.genres?.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    const sortedGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / (artists?.length || 1)) * 100),
        playsNeededForTop: 0
      }));

    return {
      totalMinutes: estimatedTotalMinutes,
      uniqueArtists: artists?.length || 0,
      uniqueTracks: tracks?.length || 0,
      currentTopGenre: sortedGenres[0]?.name || 'Unknown',
      genres: sortedGenres,
      topArtists: artists?.map((artist, index) => ({
        name: artist.name,
        playCount: Math.round(artist.popularity * 0.8),
        minutesPlayed: Math.round(estimatedTotalMinutes * (artist.popularity / 100)),
        position: index + 1,
        isTopArtist: index < 5
      })) || [],
      topTracks: tracks?.map((track, index) => ({
        name: track.name,
        artist: track.artists[0].name,
        playCount: Math.round(track.popularity * 0.7),
        lastPlayed: recentTracks?.find(rt => rt.track.id === track.id)?.played_at || new Date().toISOString(),
        position: index + 1,
        playsNeededForTop5: index < 5 ? 0 : Math.round((tracks[4].popularity - track.popularity) * 0.7)
      })) || []
    };
  };

  const generatePredictions = (stats, timeRange) => {
    // Calculate days until Wrapped cutoff (usually end of October)
    const today = new Date();
    const wrappedCutoff = new Date(today.getFullYear(), 9, 31); // October 31st
    const daysUntil = Math.max(0, Math.ceil((wrappedCutoff - today) / (1000 * 60 * 60 * 24)));

    // Project final numbers based on current stats and remaining time
    const daysElapsed = timeRange === 'short_term' ? 28 : timeRange === 'medium_term' ? 180 : 365;
    const projectionMultiplier = (daysElapsed + daysUntil) / daysElapsed;

    return {
      estimatedMinutes: Math.round((stats?.totalMinutes || 0) * projectionMultiplier),
      estimatedArtists: Math.round((stats?.uniqueArtists || 0) * projectionMultiplier),
      daysUntilWrapped: daysUntil,
      wrappedCutoffDate: wrappedCutoff.toISOString().split('T')[0],
      projectedTopGenre: stats?.currentTopGenre || 'Unknown',
      playsNeededForChanges: {
        tracks: Object.fromEntries(
          (stats?.topTracks || [])
            .filter(track => track.position > 5)
            .slice(0, 5)
            .map(track => [track.name, track.playsNeededForTop5])
        ),
        artists: Object.fromEntries(
          (stats?.topArtists || [])
            .filter(artist => !artist.isTopArtist)
            .slice(0, 3)
            .map(artist => [
              artist.name, 
              Math.round((stats.topArtists[4].playCount - artist.playCount))
            ])
        )
      }
    };
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [userDataResponse, topTracksResponse, topArtistsResponse, recentlyPlayedResponse, playlistsResponse] = await Promise.all([
        fetch('https://api.spotify.com/v1/me', { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch('https://api.spotify.com/v1/me/playlists', { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
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
      if (topTracks.items?.length > 0) {
        const trackIds = topTracks.items.map(track => track.id).join(',');
        const audioFeaturesResponse = await fetch(
          `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const audioFeaturesData = await audioFeaturesResponse.json();
        setAudioFeatures(audioFeaturesData.audio_features);
      }

      // Generate predictions and stats
      const stats = processListeningStats(topTracks.items, topArtists.items, recentlyPlayed.items);
      setListeningStats(stats);

      const predictedData = generatePredictions(stats, timeRange);
      setPredictions(predictedData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryProcessed = (processedHistory) => {
    setHistoricalData(processedHistory);
    
    // Update predictions with historical data
    if (processedHistory && listeningStats) {
      const enhancedPredictions = {
        ...predictions,
        ...processedHistory.trends,
        historicalStats: processedHistory.yearlyStats
      };
      setPredictions(enhancedPredictions);
    }
  };

  const process12MonthsData = (historicalData) => {
    if (!historicalData?.rawHistory) return null;

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const last12MonthsData = historicalData.rawHistory.filter(stream => 
      new Date(stream.ts) >= twelveMonthsAgo
    );

    // Process tracks
    const trackCounts = {};
    const artistCounts = {};
    last12MonthsData.forEach(stream => {
      if (stream.master_metadata_track_name) {
        trackCounts[stream.master_metadata_track_name] = 
          (trackCounts[stream.master_metadata_track_name] || 0) + 1;
      }
      if (stream.master_metadata_album_artist_name) {
        artistCounts[stream.master_metadata_album_artist_name] = 
          (artistCounts[stream.master_metadata_album_artist_name] || 0) + 1;
      }
    });

    return {
      tracks: Object.entries(trackCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 50)
        .map(([name, count], index) => ({
          name,
          playCount: count,
          position: index + 1,
          artist: last12MonthsData.find(s => 
            s.master_metadata_track_name === name
          )?.master_metadata_album_artist_name
        })),
      artists: Object.entries(artistCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 50)
        .map(([name, count], index) => ({
          name,
          playCount: count,
          position: index + 1
        }))
    };
  };

  const renderTopItem = (item, index, type) => (
    <div className="bg-[#2a2a2a] p-4 rounded-lg hover:bg-[#303030] transition-all duration-300">
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
            {item.popularity || item.playCount || 0} {item.playCount ? 'plays' : 'popularity'}
          </div>
        </div>
      </div>
      <ProgressBar 
        current={item.popularity || item.playCount || 0}
        max={type === 'tracks' ? 
          Math.max(...topTracks.map(t => t.popularity || t.playCount || 0)) :
          Math.max(...topArtists.map(a => a.popularity || a.playCount || 0))
        }
      />
    </div>
  );

  const renderGenreSection = () => {
    if (!topArtists || topArtists.length === 0) return null;

    const genreCounts = topArtists
      .flatMap(artist => artist.genres || [])
      .reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {});

    const sortedGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
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
              <ProgressBar 
                current={count} 
                max={Math.max(...Object.values(genreCounts))}
              />
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
            <div className="text-sm text-gray-400">
              Played at: {new Date(item.played_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPredictions = () => {
    if (!predictions || !listeningStats) return null;

    return (
      <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">Your 2024 Wrapped Predictions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Current Stats</h4>
            <div className="bg-[#2a2a2a] p-4 rounded-lg">
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Minutes Listened:</span>
                  <span className="text-white float-right">{listeningStats.totalMinutes.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Unique Artists:</span>
                  <span className="text-white float-right">{listeningStats.uniqueArtists.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Top Genre:</span>
                  <span className="text-white float-right">{listeningStats.currentTopGenre}</span>
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
                  <span className="text-white float-right">{predictions.estimatedMinutes.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Estimated Artists:</span>
                  <span className="text-white float-right">{predictions.estimatedArtists.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Projected Top Genre:</span>
                  <span className="text-white float-right">{predictions.projectedTopGenre}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Tracks Needing Plays for Top 5</h4>
            {Object.entries(predictions.playsNeededForChanges.tracks).map(([track, plays]) => (
              <div key={track} className="bg-[#2a2a2a] p-3 rounded-lg mb-2">
                <span className="text-white">{track}</span>
                <span className="text-[#1DB954] float-right">{plays} plays needed</span>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Artists Needing Plays for Top 5</h4>
            {Object.entries(predictions.playsNeededForChanges.artists).map(([artist, plays]) => (
              <div key={artist} className="bg-[#2a2a2a] p-3 rounded-lg mb-2">
                <span className="text-white">{artist}</span>
                <span className="text-[#1DB954] float-right">{plays} plays needed</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#2a2a2a] rounded-lg">
          <div className="text-white mb-2">
            <Calendar className="inline-block w-5 h-5 mr-2 text-[#1DB954]" />
            Wrapped Cutoff: {new Date(predictions.wrappedCutoffDate).toLocaleDateString()}
          </div>
          <div className="text-white">
            <Clock className="inline-block w-5 h-5 mr-2 text-[#1DB954]" />
            Days Remaining: {predictions.daysUntilWrapped}
          </div>
        </div>
      </div>
    );
  };

  const renderHistorySection = () => {
    if (!historicalData) {
      return <HistoryUploader onHistoryProcessed={handleHistoryProcessed} />;
    }

    const last12MonthsData = process12MonthsData(historicalData);

    return (
      <div className="space-y-6">
        <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Last 12 Months Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {last12MonthsData && (
              <>
                <StatCard
                  icon={Music}
                  value={last12MonthsData.tracks.length}
                  label="Unique Tracks"
                />
                <StatCard
                  icon={Disc}
                  value={last12MonthsData.artists.length}
                  label="Unique Artists"
                />
                <StatCard
                  icon={Clock}
                  value={historicalData.stats.totalStreams}
                  label="Total Streams"
                />
              </>
            )}
          </div>
        </div>

        {last12MonthsData && (
          <>
            <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">Top Tracks (Last 12 Months)</h3>
              <div className="space-y-4">
                {last12MonthsData.tracks.slice(0, showFullList ? undefined : 10).map((track, index) => 
                  renderTopItem(track, index, 'tracks')
                )}
                {last12MonthsData.tracks.length > 10 && (
                  <button
                    onClick={() => setShowFullList(!showFullList)}
                    className="mt-4 text-[#1DB954] hover:text-[#1ed760] transition-all"
                  >
                    Show {showFullList ? 'less' : 'more'}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">Top Artists (Last 12 Months)</h3>
              <div className="space-y-4">
                {last12MonthsData.artists.slice(0, showFullList ? undefined : 10).map((artist, index) => 
                  renderTopItem(artist, index, 'artists')
                )}
                {last12MonthsData.artists.length > 10 && (
                  <button
                    onClick={() => setShowFullList(!showFullList)}
                    className="mt-4 text-[#1DB954] hover:text-[#1ed760] transition-all"
                  >
                    Show {showFullList ? 'less' : 'more'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
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

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1DB954] to-[#179443] rounded-xl shadow-lg mb-6 p-8">
          <h1 className="text-3xl font-bold mb-2">Your Spotify Stats & Predictions</h1>
          <p className="text-lg opacity-90">
            Based on your {timeRange === 'short_term' ? 'last 4 weeks' : timeRange === 'medium_term' ? 'last 6 months' : 'all time'} listening history
          </p>
        </div>

        {/* Time Range Selector (hide for history tab) */}
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard 
                  icon={Music}
                  value={topTracks.length}
                  label="Top Tracks"
                  subValue={historicalData ? `${historicalData.stats.uniqueTracks} lifetime` : undefined}
                />
                <StatCard 
                  icon={Disc}
                  value={topArtists.length}
                  label="Top Artists"
                  subValue={historicalData ? `${historicalData.stats.uniqueArtists} lifetime` : undefined}
                />
                <StatCard 
                  icon={Clock}
                  value={recentlyPlayed.length}
                  label="Recently Played"
                  subValue={historicalData ? `${historicalData.stats.totalStreams} lifetime` : undefined}
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
                    .slice(0, showFullList ? undefined : 10)
                    .map((track, index) => renderTopItem(track, index, 'tracks'))}
                </div>
                {topTracks.length > 10 && (
                  <button
                    onClick={() => setShowFullList(!showFullList)}
                    className="mt-4 text-[#1DB954] hover:text-[#1ed760] transition-all"
                  >
                    Show {showFullList ? 'less' : 'more'}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'top artists' && (
            <div className="space-y-6">
              <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">Your Top Artists</h3>
                <div className="space-y-4">
                  {topArtists
                    .slice(0, showFullList ? undefined : 10)
                    .map((artist, index) => renderTopItem(artist, index, 'artists'))}
                </div>
                {topArtists.length > 10 && (
                  <button
                    onClick={() => setShowFullList(!showFullList)}
                    className="mt-4 text-[#1DB954] hover:text-[#1ed760] transition-all"
                  >
                    Show {showFullList ? 'less' : 'more'}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'genres' && renderGenreSection()}
          {activeTab === 'history' && renderHistorySection()}
          {activeTab === 'predictions' && predictions && renderPredictions()}
        </div>
      </div>
    </div>
  );
}

export default MainPage;