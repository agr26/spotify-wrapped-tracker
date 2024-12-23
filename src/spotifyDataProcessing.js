export const processListeningStats = (rawData) => {
    if (!Array.isArray(rawData) || rawData.length === 0) return null;
  
    // Initialize stats object
    const stats = {
      totalMinutes: 0,
      uniqueTracks: new Set(),
      uniqueArtists: new Set(),
      topArtists: {},
      topTracks: {},
      monthlyStats: {},
      trends: {
        growth: {
          minutes: 0,
          uniqueTracks: 0,
          uniqueArtists: 0
        }
      }
    };
  
    // Process each entry
    rawData.forEach(entry => {
      // Calculate minutes
      const minutes = Math.floor((entry.ms_played || 0) / 60000);
      stats.totalMinutes += minutes;
  
      // Track unique items
      if (entry.master_metadata_track_name) {
        stats.uniqueTracks.add(entry.master_metadata_track_name);
      }
      if (entry.master_metadata_album_artist_name) {
        stats.uniqueArtists.add(entry.master_metadata_album_artist_name);
      }
  
      // Count plays for artists and tracks
      if (entry.master_metadata_album_artist_name) {
        stats.topArtists[entry.master_metadata_album_artist_name] = 
          (stats.topArtists[entry.master_metadata_album_artist_name] || 0) + 1;
      }
      if (entry.master_metadata_track_name) {
        stats.topTracks[entry.master_metadata_track_name] = {
          plays: (stats.topTracks[entry.master_metadata_track_name]?.plays || 0) + 1,
          artist: entry.master_metadata_album_artist_name,
          lastPlayed: entry.ts
        };
      }
  
      // Monthly stats
      if (entry.ts) {
        const monthKey = entry.ts.substring(0, 7); // YYYY-MM format
        if (!stats.monthlyStats[monthKey]) {
          stats.monthlyStats[monthKey] = {
            streams: 0,
            minutes: 0,
            uniqueTracks: new Set(),
            uniqueArtists: new Set()
          };
        }
        const monthStats = stats.monthlyStats[monthKey];
        monthStats.streams++;
        monthStats.minutes += minutes;
        monthStats.uniqueTracks.add(entry.master_metadata_track_name);
        monthStats.uniqueArtists.add(entry.master_metadata_album_artist_name);
      }
    });
  
    // Convert sets to arrays/counts and format data
    stats.uniqueTracks = stats.uniqueTracks.size;
    stats.uniqueArtists = stats.uniqueArtists.size;
  
    // Process top artists
    stats.topArtists = Object.entries(stats.topArtists)
      .map(([name, playCount]) => ({
        name,
        playCount,
        position: 0
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .map((artist, index) => ({
        ...artist,
        position: index + 1,
        isTopArtist: index < 5
      }));
  
    // Process top tracks
    stats.topTracks = Object.entries(stats.topTracks)
      .map(([name, data]) => ({
        name,
        artist: data.artist,
        playCount: data.plays,
        lastPlayed: data.lastPlayed,
        position: 0
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .map((track, index) => ({
        ...track,
        position: index + 1,
        playsNeededForTop5: index < 5 ? 0 : track.playCount - stats.topTracks[4].playCount + 1
      }));
  
    // Convert monthly stats sets to counts
    Object.keys(stats.monthlyStats).forEach(month => {
      const monthData = stats.monthlyStats[month];
      monthData.uniqueTracks = monthData.uniqueTracks.size;
      monthData.uniqueArtists = monthData.uniqueArtists.size;
    });
  
    // Calculate growth trends
    const months = Object.keys(stats.monthlyStats).sort();
    if (months.length >= 2) {
      const calculateGrowth = (metric) => {
        const lastSixMonths = months.slice(-6);
        const previousSixMonths = months.slice(-12, -6);
        
        const recentAvg = lastSixMonths.reduce((sum, month) => 
          sum + stats.monthlyStats[month][metric], 0) / lastSixMonths.length;
        const previousAvg = previousSixMonths.reduce((sum, month) => 
          sum + stats.monthlyStats[month][metric], 0) / previousSixMonths.length;
        
        return previousAvg === 0 ? 0 : ((recentAvg - previousAvg) / previousAvg) * 100;
      };
  
      stats.trends.growth = {
        minutes: calculateGrowth('minutes'),
        uniqueTracks: calculateGrowth('uniqueTracks'),
        uniqueArtists: calculateGrowth('uniqueArtists')
      };
    }
  
    return stats;
  };
  
  export const generatePredictions = (stats, timeRange = 'all') => {
    if (!stats) return null;
  
    // Calculate days until 2025 Wrapped cutoff (October 31, 2025)
    const today = new Date();
    const wrappedCutoff = new Date(2025, 9, 31); // October 31st, 2025
    const daysUntil = Math.max(0, Math.ceil((wrappedCutoff - today) / (1000 * 60 * 60 * 24)));
  
    // Calculate daily averages based on time range
    const daysElapsed = timeRange === '30days' ? 30 
      : timeRange === '90days' ? 90 
      : timeRange === 'year' ? (today - new Date(today.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)
      : 365;
  
    const dailyMinutes = stats.totalMinutes / daysElapsed;
    const dailyArtists = stats.uniqueArtists / daysElapsed;
  
    // Project to end of year
    const remainingDays = Math.min(daysUntil, 365 - daysElapsed);
    
    return {
      estimatedMinutes: Math.round(stats.totalMinutes + (dailyMinutes * remainingDays)),
      estimatedArtists: Math.round(stats.uniqueArtists + (dailyArtists * remainingDays)),
      daysUntilWrapped: daysUntil,
      wrappedCutoffDate: wrappedCutoff.toISOString().split('T')[0],
      projectedTopGenre: "Based on your history", // You can enhance this with genre analysis
      playsNeededForChanges: {
        tracks: Object.fromEntries(
          stats.topTracks
            .filter(track => track.position > 5)
            .slice(0, 5)
            .map(track => [track.name, track.playsNeededForTop5])
        ),
        artists: Object.fromEntries(
          stats.topArtists
            .filter(artist => !artist.isTopArtist)
            .slice(0, 3)
            .map(artist => [
              artist.name,
              Math.max(1, stats.topArtists[4].playCount - artist.playCount + 1)
            ])
        )
      }
    };
  };