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
  
      // Time of day distribution
      const hour = date.getHours();
      if (hour >= 6 && hour < 12) stats.timeOfDayDistribution.morning++;
      else if (hour >= 12 && hour < 18) stats.timeOfDayDistribution.afternoon++;
      else if (hour >= 18) stats.timeOfDayDistribution.evening++;
      else stats.timeOfDayDistribution.night++;
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
  
  export const predictWrappedStats = (history, currentYear) => {
    // Filter current year's data
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
      currentStats: {
        totalStreams: currentYearData.length,
        totalMinutes: Math.round(currentYearData.reduce((acc, stream) => 
          acc + stream.ms_played / 60000, 0
        ))
      }
    };
  };