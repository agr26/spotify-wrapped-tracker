export const processSpotifyHistory = async (files) => {
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

  // Calculate stats
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

const calculateHistoryStats = (history) => {
  const stats = {
    totalStreams: history.length,
    totalMinutes: 0,
    uniqueTracks: new Set(),
    uniqueArtists: new Set(),
    artistPlayCounts: {},
    trackPlayCounts: {},
    monthlyMinutes: {}
  };

  history.forEach(stream => {
    // Track minutes
    const minutes = Math.floor(stream.ms_played / 60000);
    stats.totalMinutes += minutes;

    // Track unique items
    stats.uniqueTracks.add(stream.master_metadata_track_name);
    stats.uniqueArtists.add(stream.master_metadata_album_artist_name);

    // Count plays
    const artistName = stream.master_metadata_album_artist_name;
    const trackName = stream.master_metadata_track_name;
    
    stats.artistPlayCounts[artistName] = (stats.artistPlayCounts[artistName] || 0) + 1;
    stats.trackPlayCounts[trackName] = (stats.trackPlayCounts[trackName] || 0) + 1;

    // Monthly stats
    const date = new Date(stream.ts);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    stats.monthlyMinutes[monthKey] = (stats.monthlyMinutes[monthKey] || 0) + minutes;
  });

  // Convert sets to counts
  stats.uniqueTracks = stats.uniqueTracks.size;
  stats.uniqueArtists = stats.uniqueArtists.size;

  // Get top items
  stats.topArtists = Object.entries(stats.artistPlayCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 50)
    .map(([name, playCount], index) => ({
      name,
      playCount,
      position: index + 1,
      isTopArtist: index < 5
    }));

  stats.topTracks = Object.entries(stats.trackPlayCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 50)
    .map(([name, playCount], index) => ({
      name,
      playCount,
      position: index + 1,
      playsNeededForTop5: index < 5 ? 0 : playCount - stats.topTracks[4].playCount + 1
    }));

  return stats;
};

const calculateYearlyStats = (history) => {
  const yearlyStats = {};

  history.forEach(stream => {
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
    stats.totalMinutes += Math.floor(stream.ms_played / 60000);
    stats.uniqueTracks.add(stream.master_metadata_track_name);
    stats.uniqueArtists.add(stream.master_metadata_album_artist_name);
  });

  // Convert sets to counts
  Object.values(yearlyStats).forEach(stats => {
    stats.uniqueTracks = stats.uniqueTracks.size;
    stats.uniqueArtists = stats.uniqueArtists.size;
  });

  return yearlyStats;
};

const calculateTrends = (history) => {
  // Get last 12 months of data
  const last12Months = new Array(12).fill(0).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7); // YYYY-MM format
  }).reverse();

  const monthlyTrends = last12Months.map(month => {
    const monthlyStreams = history.filter(stream => stream.ts.startsWith(month));
    return {
      month,
      streams: monthlyStreams.length,
      minutes: Math.floor(monthlyStreams.reduce((acc, stream) => acc + stream.ms_played, 0) / 60000),
      uniqueArtists: new Set(monthlyStreams.map(s => s.master_metadata_album_artist_name)).size,
      uniqueTracks: new Set(monthlyStreams.map(s => s.master_metadata_track_name)).size
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

const calculateGrowthRate = (values) => {
  if (values.length < 2) return 0;
  const oldValue = values.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
  const newValue = values.slice(-6).reduce((a, b) => a + b, 0) / 6;
  return oldValue === 0 ? 0 : ((newValue - oldValue) / oldValue) * 100;
};