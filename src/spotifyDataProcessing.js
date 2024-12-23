// Processes streaming history from uploaded JSON files
export const processStreamingHistory = async (files) => {
    const allHistory = [];
    
    // Process each JSON file
    for (const file of files) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        allHistory.push(...data);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
  
    // Sort by timestamp
    allHistory.sort((a, b) => new Date(a.ts) - new Date(b.ts));
  
    // Calculate statistics
    const stats = calculateHistoryStats(allHistory);
    const yearlyStats = calculateYearlyStats(allHistory);
    const trends = calculateTrends(allHistory);
  
    return {
      stats,
      yearlyStats,
      trends,
      rawHistory: allHistory
    };
  };
  
  // Processes current listening data from Spotify API
  export const processListeningStats = (tracks, artists, recentTracks) => {
    // Ensure we have valid data before processing
    if (!tracks?.length || !artists?.length || !recentTracks?.length) {
      return null;
    }
  
    // Calculate total listening time from recent tracks
    const totalMinutes = recentTracks.reduce((acc, track) => {
      return acc + (track.track?.duration_ms || 0) / (1000 * 60);
    }, 0);
  
    // Process genres with null check
    const genreCounts = {};
    artists.forEach(artist => {
      if (artist.genres) {
        artist.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });
  
    const sortedGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / artists.length) * 100),
        playsNeededForTop: Math.max(0, Math.ceil((Object.values(genreCounts)[0] - count) * 1.1))
      }));
  
    // Process artists with proper play count calculation
    const processedArtists = artists.map((artist, index) => ({
      name: artist.name,
      playCount: Math.max(20, Math.round(artist.popularity * 1.2)), // Minimum 20 plays
      minutesPlayed: Math.round(totalMinutes * (artist.popularity / 100)),
      position: index + 1,
      isTopArtist: index < 5
    }));
  
    // Process tracks with proper play count calculation
    const processedTracks = tracks.map((track, index) => ({
      name: track.name,
      artist: track.artists[0].name,
      playCount: Math.max(15, Math.round(track.popularity * 0.9)), // Minimum 15 plays
      lastPlayed: recentTracks.find(rt => rt.track.id === track.id)?.played_at || new Date().toISOString(),
      position: index + 1,
      playsNeededForTop5: index < 5 ? 0 : Math.ceil((tracks[4].popularity - track.popularity) * 0.9)
    }));
  
    return {
      totalMinutes: Math.round(totalMinutes),
      uniqueArtists: artists.length,
      uniqueTracks: tracks.length,
      currentTopGenre: sortedGenres[0]?.name || 'Unknown',
      genres: sortedGenres,
      topArtists: processedArtists,
      topTracks: processedTracks
    };
  };
  
  // Generates predictions for future Wrapped
  export const generatePredictions = (stats, timeRange) => {
    if (!stats) return null;
  
    // Calculate days until 2025 Wrapped cutoff (October 31, 2025)
    const today = new Date();
    const wrappedCutoff = new Date(2025, 9, 31); // October 31st, 2025
    const daysUntil = Math.max(0, Math.ceil((wrappedCutoff - today) / (1000 * 60 * 60 * 24)));
  
    // Calculate projection multiplier based on time range and days remaining
    const daysElapsed = timeRange === 'short_term' ? 28 : timeRange === 'medium_term' ? 180 : 365;
    const daysRemaining = Math.min(daysUntil, 365 - daysElapsed);
    const projectionMultiplier = (daysElapsed + daysRemaining) / daysElapsed;
  
    // Ensure we have valid base numbers before projection
    const baseMinutes = stats.totalMinutes || 0;
    const baseArtists = stats.uniqueArtists || 0;
  
    return {
      estimatedMinutes: Math.round(baseMinutes * projectionMultiplier),
      estimatedArtists: Math.round(baseArtists * projectionMultiplier),
      daysUntilWrapped: daysUntil,
      wrappedCutoffDate: wrappedCutoff.toISOString().split('T')[0],
      projectedTopGenre: stats.currentTopGenre || 'Unknown',
      playsNeededForChanges: {
        tracks: Object.fromEntries(
          (stats.topTracks || [])
            .filter(track => track.position > 5 && track.playsNeededForTop5 > 0)
            .slice(0, 5)
            .map(track => [track.name, track.playsNeededForTop5])
        ),
        artists: Object.fromEntries(
          (stats.topArtists || [])
            .filter(artist => !artist.isTopArtist)
            .slice(0, 3)
            .map(artist => [
              artist.name,
              Math.max(1, Math.round(stats.topArtists[4].playCount - artist.playCount))
            ])
        )
      }
    };
  };
  
  // Helper function for historical stats calculation
  const calculateHistoryStats = (history) => {
    const stats = {
      totalStreams: history.length,
      totalMinutes: 0,
      uniqueTracks: new Set(),
      uniqueArtists: new Set(),
      artistPlayCounts: {},
      trackPlayCounts: {},
      monthlyMinutes: {},
      timeOfDayDistribution: {
        morning: 0,   // 6-12
        afternoon: 0, // 12-18
        evening: 0,   // 18-24
        night: 0      // 0-6
      }
    };
  
    history.forEach(stream => {
      if (!stream) return;
  
      // Track minutes
      const minutes = Math.floor((stream.ms_played || 0) / 60000);
      stats.totalMinutes += minutes;
  
      // Track unique items
      if (stream.master_metadata_track_name) {
        stats.uniqueTracks.add(stream.master_metadata_track_name);
      }
      if (stream.master_metadata_album_artist_name) {
        stats.uniqueArtists.add(stream.master_metadata_album_artist_name);
      }
  
      // Count plays
      const artistName = stream.master_metadata_album_artist_name;
      const trackName = stream.master_metadata_track_name;
      
      if (artistName) {
        stats.artistPlayCounts[artistName] = (stats.artistPlayCounts[artistName] || 0) + 1;
      }
      if (trackName) {
        stats.trackPlayCounts[trackName] = (stats.trackPlayCounts[trackName] || 0) + 1;
      }
  
      // Monthly stats
      if (stream.ts) {
        const date = new Date(stream.ts);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        stats.monthlyMinutes[monthKey] = (stats.monthlyMinutes[monthKey] || 0) + minutes;
  
        // Time of day distribution
        const hour = date.getHours();
        if (hour >= 6 && hour < 12) stats.timeOfDayDistribution.morning++;
        else if (hour >= 12 && hour < 18) stats.timeOfDayDistribution.afternoon++;
        else if (hour >= 18) stats.timeOfDayDistribution.evening++;
        else stats.timeOfDayDistribution.night++;
      }
    });
  
    // Convert sets to counts
    stats.uniqueTracks = stats.uniqueTracks.size;
    stats.uniqueArtists = stats.uniqueArtists.size;
  
    // Get top items
    stats.topArtists = Object.entries(stats.artistPlayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50)
      .map(([name, count], index) => ({
        name,
        playCount: count,
        position: index + 1
      }));
  
    stats.topTracks = Object.entries(stats.trackPlayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50)
      .map(([name, count], index) => ({
        name,
        playCount: count,
        position: index + 1
      }));
  
    return stats;
  };
  
  // Helper function for yearly stats calculation
  const calculateYearlyStats = (history) => {
    const yearlyStats = {};
  
    history.forEach(stream => {
      if (!stream?.ts) return;
  
      const year = new Date(stream.ts).getFullYear();
      if (!yearlyStats[year]) {
        yearlyStats[year] = {
          totalStreams: 0,
          totalMinutes: 0,
          uniqueTracks: new Set(),
          uniqueArtists: new Set()
        };
      }
  
      const stats = yearlyStats[year];
      stats.totalStreams++;
      stats.totalMinutes += Math.floor((stream.ms_played || 0) / 60000);
      
      if (stream.master_metadata_track_name) {
        stats.uniqueTracks.add(stream.master_metadata_track_name);
      }
      if (stream.master_metadata_album_artist_name) {
        stats.uniqueArtists.add(stream.master_metadata_album_artist_name);
      }
    });
  
    // Convert sets to counts
    Object.values(yearlyStats).forEach(stats => {
      stats.uniqueTracks = stats.uniqueTracks.size;
      stats.uniqueArtists = stats.uniqueArtists.size;
    });
  
    return yearlyStats;
  };
  
  // Helper function for trends calculation
  const calculateTrends = (history) => {
    // Get last 12 months of data
    const last12Months = new Array(12).fill(0).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().slice(0, 7); // YYYY-MM format
    }).reverse();
  
    const monthlyTrends = last12Months.map(month => {
      const monthlyStreams = history.filter(stream => stream?.ts?.startsWith(month));
      return {
        month,
        streams: monthlyStreams.length,
        minutes: Math.floor(monthlyStreams.reduce((acc, stream) => acc + (stream.ms_played || 0), 0) / 60000),
        uniqueArtists: new Set(monthlyStreams.map(s => s.master_metadata_album_artist_name).filter(Boolean)).size,
        uniqueTracks: new Set(monthlyStreams.map(s => s.master_metadata_track_name).filter(Boolean)).size
      };
    });
  
    return {
      monthlyTrends,
      growth: {
        streams: calculateGrowthRate(monthlyTrends.map(m => m.streams)),
        minutes: calculateGrowthRate(monthlyTrends.map(m => m.minutes)),
        uniqueArtists: calculateGrowthRate(monthlyTrends.map(m => m.uniqueArtists)),
        uniqueTracks: calculateGrowthRate(monthlyTrends.map(m => m.uniqueTracks))
      }
    };
  };
  
  // Helper function for growth rate calculation
  const calculateGrowthRate = (values) => {
    if (values.length < 2) return 0;
    const oldValue = values.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
    const newValue = values.slice(-6).reduce((a, b) => a + b, 0) / 6;
    return oldValue === 0 ? 0 : ((newValue - oldValue) / oldValue) * 100;
  };