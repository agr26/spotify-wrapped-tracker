export const processStreamingHistory = (history) => {
  // Sort by timestamp
  const sortedHistory = [...history].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  
  // Calculate statistics
  const stats = calculateHistoryStats(sortedHistory);
  const yearlyStats = calculateYearlyStats(sortedHistory);
  const monthlyStats = calculateMonthlyStats(sortedHistory);
  const trends = calculateTrends(sortedHistory);
  
  return {
    stats,
    yearlyStats,
    monthlyStats,
    trends,
    rawHistory: sortedHistory
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
    albumPlayCounts: {},
    monthlyMinutes: {},
    timeOfDayDistribution: {
      morning: 0,   // 6-12
      afternoon: 0, // 12-18
      evening: 0,   // 18-24
      night: 0      // 0-6
    },
    weekdayDistribution: {
      Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0,
      Friday: 0, Saturday: 0, Sunday: 0
    }
  };

  history.forEach(stream => {
    const date = new Date(stream.ts);
    const minutes = Math.floor(stream.ms_played / 60000);
    
    // Basic stats
    stats.totalMinutes += minutes;
    stats.uniqueTracks.add(stream.master_metadata_track_name);
    stats.uniqueArtists.add(stream.master_metadata_album_artist_name);
    
    // Play counts
    const artistName = stream.master_metadata_album_artist_name;
    const trackName = stream.master_metadata_track_name;
    const albumName = stream.master_metadata_album_name;
    
    stats.artistPlayCounts[artistName] = (stats.artistPlayCounts[artistName] || 0) + 1;
    stats.trackPlayCounts[trackName] = (stats.trackPlayCounts[trackName] || 0) + 1;
    if (albumName) {
      stats.albumPlayCounts[albumName] = (stats.albumPlayCounts[albumName] || 0) + 1;
    }
    
    // Time distributions
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) stats.timeOfDayDistribution.morning++;
    else if (hour >= 12 && hour < 18) stats.timeOfDayDistribution.afternoon++;
    else if (hour >= 18) stats.timeOfDayDistribution.evening++;
    else stats.timeOfDayDistribution.night++;
    
    // Weekday distribution
    const weekday = date.toLocaleString('en-US', { weekday: 'long' });
    stats.weekdayDistribution[weekday]++;
    
    // Monthly stats
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    stats.monthlyMinutes[monthKey] = (stats.monthlyMinutes[monthKey] || 0) + minutes;
  });

  // Convert sets to counts
  stats.uniqueTracks = stats.uniqueTracks.size;
  stats.uniqueArtists = stats.uniqueArtists.size;

  // Calculate top items
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

  stats.topAlbums = Object.entries(stats.albumPlayCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 50)
    .map(([name, count], index) => ({
      name,
      playCount: count,
      position: index + 1
    }));

  return stats;
};

const calculateMonthlyStats = (history) => {
  const monthlyStats = {};
  
  history.forEach(stream => {
    const date = new Date(stream.ts);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = {
        streams: 0,
        minutes: 0,
        uniqueTracks: new Set(),
        uniqueArtists: new Set(),
        topTracks: {},
        topArtists: {}
      };
    }
    
    const stats = monthlyStats[monthKey];
    stats.streams++;
    stats.minutes += Math.floor(stream.ms_played / 60000);
    stats.uniqueTracks.add(stream.master_metadata_track_name);
    stats.uniqueArtists.add(stream.master_metadata_album_artist_name);
    
    const trackName = stream.master_metadata_track_name;
    const artistName = stream.master_metadata_album_artist_name;
    
    stats.topTracks[trackName] = (stats.topTracks[trackName] || 0) + 1;
    stats.topArtists[artistName] = (stats.topArtists[artistName] || 0) + 1;
  });
  
  // Process each month's data
  Object.keys(monthlyStats).forEach(month => {
    const stats = monthlyStats[month];
    stats.uniqueTracks = stats.uniqueTracks.size;
    stats.uniqueArtists = stats.uniqueArtists.size;
    
    // Convert play counts to sorted arrays
    stats.topTracks = Object.entries(stats.topTracks)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, plays]) => ({ name, plays }));
    
    stats.topArtists = Object.entries(stats.topArtists)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, plays]) => ({ name, plays }));
  });
  
  return monthlyStats;
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
        uniqueArtists: new Set(),
        artistPlayCounts: {},
        trackPlayCounts: {},
        timeOfDayDistribution: {
          morning: 0,   // 6-12
          afternoon: 0, // 12-18
          evening: 0,   // 18-24
          night: 0      // 0-6
        }
      };
    }

    const stats = yearlyStats[year];
    const date = new Date(stream.ts);
    const minutes = Math.floor(stream.ms_played / 60000);

    // Update basic stats
    stats.totalStreams++;
    stats.totalMinutes += minutes;
    stats.uniqueTracks.add(stream.master_metadata_track_name);
    stats.uniqueArtists.add(stream.master_metadata_album_artist_name);

    // Update play counts
    const artistName = stream.master_metadata_album_artist_name;
    const trackName = stream.master_metadata_track_name;
    
    stats.artistPlayCounts[artistName] = (stats.artistPlayCounts[artistName] || 0) + 1;
    stats.trackPlayCounts[trackName] = (stats.trackPlayCounts[trackName] || 0) + 1;

    // Update time of day distribution
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) stats.timeOfDayDistribution.morning++;
    else if (hour >= 12 && hour < 18) stats.timeOfDayDistribution.afternoon++;
    else if (hour >= 18) stats.timeOfDayDistribution.evening++;
    else stats.timeOfDayDistribution.night++;
  });

  // Process each year's data
  Object.keys(yearlyStats).forEach(year => {
    const stats = yearlyStats[year];
    
    // Convert sets to counts
    stats.uniqueTracks = stats.uniqueTracks.size;
    stats.uniqueArtists = stats.uniqueArtists.size;

    // Calculate top items
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
    const monthlyStreams = history.filter(stream => {
      try {
        // Safely handle date comparison
        const streamDate = new Date(stream.ts);
        const streamMonth = streamDate.toISOString().slice(0, 7);
        return streamMonth === month;
      } catch (error) {
        console.error('Error processing stream date:', error);
        return false;
      }
    });

    return {
      month,
      streams: monthlyStreams.length,
      minutes: Math.floor(monthlyStreams.reduce((acc, stream) => acc + (stream.ms_played || 0), 0) / 60000),
      uniqueArtists: new Set(monthlyStreams.map(s => s.master_metadata_album_artist_name)).size,
      uniqueTracks: new Set(monthlyStreams.map(s => s.master_metadata_track_name)).size
    };
  });

  // Calculate growth rates
  const calculateGrowthRate = (values) => {
    if (values.length < 2) return 0;
    const oldValue = values.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
    const newValue = values.slice(-6).reduce((a, b) => a + b, 0) / 6;
    return oldValue === 0 ? 0 : ((newValue - oldValue) / oldValue) * 100;
  };

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

export const predictWrapped = (history) => {
  const currentYear = new Date().getFullYear();
  const currentYearData = history.filter(stream => 
    new Date(stream.ts).getFullYear() === currentYear
  );
  
  // Calculate days elapsed in current year
  const firstStream = new Date(currentYearData[0]?.ts);
  const lastStream = new Date(currentYearData[currentYearData.length - 1]?.ts);
  const daysElapsed = Math.ceil((lastStream - firstStream) / (1000 * 60 * 60 * 24));
  
  // Calculate daily averages
  const dailyStreams = currentYearData.length / daysElapsed;
  const dailyMinutes = currentYearData.reduce((acc, stream) => 
    acc + stream.ms_played / 60000, 0) / daysElapsed;
  
  // Project to end of October (Wrapped cutoff)
  const wrappedCutoff = new Date(currentYear, 9, 31); // October 31st
  const daysUntilCutoff = Math.max(0, Math.ceil((wrappedCutoff - lastStream) / (1000 * 60 * 60 * 24)));
  
  return {
    projectedStreams: Math.round(currentYearData.length + (dailyStreams * daysUntilCutoff)),
    projectedMinutes: Math.round(
      currentYearData.reduce((acc, stream) => acc + stream.ms_played / 60000, 0) +
      (dailyMinutes * daysUntilCutoff)
    ),
    daysUntilWrapped: daysUntilCutoff,
    wrappedCutoffDate: wrappedCutoff.toISOString().split('T')[0],
    currentStats: calculateHistoryStats(currentYearData)
  };
};