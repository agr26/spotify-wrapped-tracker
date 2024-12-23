// Handles both API data and extended history processing
export const processSpotifyData = (apiData, historyData = null) => {
    const {
      topTracks,
      topArtists,
      recentlyPlayed,
      audioFeatures
    } = apiData;
  
    // Process API data first
    const baseStats = processApiData(apiData);
    
    // Enhance with history data if available
    if (historyData) {
      return enhanceWithHistory(baseStats, historyData);
    }
  
    return baseStats;
  };
  
  const processApiData = ({ topTracks, topArtists, recentlyPlayed }) => {
    // Calculate basic stats from API data
    const stats = {
      totalMinutes: estimateMinutesFromRecent(recentlyPlayed),
      uniqueTracks: new Set(topTracks.map(t => t.id)).size,
      uniqueArtists: new Set(topArtists.map(a => a.id)).size,
      topArtists: topArtists.map((artist, index) => ({
        name: artist.name,
        id: artist.id,
        popularity: artist.popularity,
        playCount: estimatePlayCount(artist.popularity),
        position: index + 1,
        isTopArtist: index < 5
      })),
      topTracks: topTracks.map((track, index) => ({
        name: track.name,
        id: track.id,
        artist: track.artists[0].name,
        popularity: track.popularity,
        playCount: estimatePlayCount(track.popularity),
        position: index + 1,
        playsNeededForTop5: index < 5 ? 0 : estimatePlayCount(topTracks[4].popularity) - estimatePlayCount(track.popularity) + 1
      })),
      recentActivity: processRecentActivity(recentlyPlayed),
      genres: processGenres(topArtists)
    };
  
    return stats;
  };
  
  const enhanceWithHistory = (apiStats, historyData) => {
    const historicalStats = processHistoricalData(historyData);
    
    // Combine and enhance stats
    return {
      ...apiStats,
      totalMinutes: historicalStats.totalMinutes,
      historicalPlayCounts: historicalStats.playCounts,
      trends: historicalStats.trends,
      yearOverYear: historicalStats.yearlyComparison,
      enhancedPredictions: {
        accuracy: 'high',
        source: 'combined',
        confidence: 0.9
      }
    };
  };
  
  const processHistoricalData = (history) => {
    // Process extended history JSON data
    const stats = {
      totalMinutes: 0,
      playCounts: {
        tracks: {},
        artists: {}
      },
      trends: {},
      yearlyComparison: {}
    };
  
    history.forEach(stream => {
      // Add actual play counts and durations
      const minutes = Math.floor(stream.ms_played / 60000);
      stats.totalMinutes += minutes;
      
      const artistName = stream.master_metadata_album_artist_name;
      const trackName = stream.master_metadata_track_name;
      
      stats.playCounts.tracks[trackName] = (stats.playCounts.tracks[trackName] || 0) + 1;
      stats.playCounts.artists[artistName] = (stats.playCounts.artists[artistName] || 0) + 1;
    });
  
    return stats;
  };
  
  // Helper functions
  const estimatePlayCount = (popularity) => {
    // Estimate play count from popularity score
    return Math.round(popularity * 1.5);
  };
  
  const estimateMinutesFromRecent = (recentlyPlayed) => {
    // Estimate total minutes from recent plays
    return recentlyPlayed.reduce((total, play) => 
      total + (play.track.duration_ms / 60000), 0);
  };
  
  const processRecentActivity = (recentlyPlayed) => {
    // Process recent activity patterns
    return recentlyPlayed.reduce((patterns, play) => {
      const hour = new Date(play.played_at).getHours();
      patterns.hourly[hour] = (patterns.hourly[hour] || 0) + 1;
      return patterns;
    }, { hourly: Array(24).fill(0) });
  };
  
  const processGenres = (artists) => {
    // Process genre information from artists
    const genreCounts = artists.reduce((counts, artist) => {
      artist.genres?.forEach(genre => {
        counts[genre] = (counts[genre] || 0) + 1;
      });
      return counts;
    }, {});
  
    return Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / artists.length) * 100)
      }));
  };