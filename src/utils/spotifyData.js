import history2021_2022_0 from '../data/Streaming_History_Audio_2021-2022_0.json';
import history2022_2023_1 from '../data/Streaming_History_Audio_2022-2023_1.json';
import history2023_2 from '../data/Streaming_History_Audio_2023_2.json';
import history2023_2024_3 from '../data/Streaming_History_Audio_2023-2024_3.json';
import history2024_4 from '../data/Streaming_History_Audio_2024_4.json';
import history2024_5 from '../data/Streaming_History_Audio_2024_5.json';
import historyMusic0 from '../data/StreamingHistory_music_0.json';
import historyMusic1 from '../data/StreamingHistory_music_1.json';
import historyMusic2 from '../data/StreamingHistory_music_2.json';

// Combine all history data
const allHistoryData = [
  ...history2021_2022_0,
  ...history2022_2023_1,
  ...history2023_2,
  ...history2023_2024_3,
  ...history2024_4,
  ...history2024_5,
  ...historyMusic0,
  ...historyMusic1,
  ...historyMusic2
].filter(item => {
  // Filter out invalid entries
  return item && 
    (item.ts || item.endTime) && // Handle both timestamp formats
    (item.ms_played || item.msPlayed) && 
    (item.master_metadata_track_name || item.trackName) &&
    (item.master_metadata_album_artist_name || item.artistName);
}).map(item => ({
  // Normalize the data structure
  ts: item.ts || item.endTime,
  ms_played: item.ms_played || item.msPlayed,
  master_metadata_track_name: item.master_metadata_track_name || item.trackName,
  master_metadata_album_artist_name: item.master_metadata_album_artist_name || item.artistName
})).sort((a, b) => new Date(a.ts) - new Date(b.ts));

function calculateHistoryStats(history) {
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
    if (!stream.ts || !stream.ms_played) return;

    const minutes = Math.floor(stream.ms_played / 60000);
    stats.totalMinutes += minutes;

    if (stream.master_metadata_track_name) {
      stats.uniqueTracks.add(stream.master_metadata_track_name);
      stats.trackPlayCounts[stream.master_metadata_track_name] = 
        (stats.trackPlayCounts[stream.master_metadata_track_name] || 0) + 1;
    }

    if (stream.master_metadata_album_artist_name) {
      stats.uniqueArtists.add(stream.master_metadata_album_artist_name);
      stats.artistPlayCounts[stream.master_metadata_album_artist_name] = 
        (stats.artistPlayCounts[stream.master_metadata_album_artist_name] || 0) + 1;
    }

    try {
      const date = new Date(stream.ts);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      stats.monthlyMinutes[monthKey] = (stats.monthlyMinutes[monthKey] || 0) + minutes;

      const hour = date.getHours();
      if (hour >= 6 && hour < 12) stats.timeOfDayDistribution.morning++;
      else if (hour >= 12 && hour < 18) stats.timeOfDayDistribution.afternoon++;
      else if (hour >= 18) stats.timeOfDayDistribution.evening++;
      else stats.timeOfDayDistribution.night++;
    } catch (error) {
      console.error('Error processing date:', error);
    }
  });

  stats.uniqueTracks = stats.uniqueTracks.size;
  stats.uniqueArtists = stats.uniqueArtists.size;

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
      playsNeededForTop5: index < 5 ? 0 : Math.round(playCount * 1.1) - playCount
    }));

  return stats;
}

function calculateYearlyStats(history) {
  const yearlyStats = {};

  history.forEach(stream => {
    if (!stream.ts || !stream.ms_played) return;

    try {
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
      if (stream.master_metadata_track_name) {
        stats.uniqueTracks.add(stream.master_metadata_track_name);
      }
      if (stream.master_metadata_album_artist_name) {
        stats.uniqueArtists.add(stream.master_metadata_album_artist_name);
      }
    } catch (error) {
      console.error('Error processing yearly stats:', error);
    }
  });

  Object.values(yearlyStats).forEach(stats => {
    stats.uniqueTracks = stats.uniqueTracks.size;
    stats.uniqueArtists = stats.uniqueArtists.size;
  });

  return yearlyStats;
}

function calculateTrends(history) {
  const last12Months = new Array(12).fill(0).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  }).reverse();

  const monthlyTrends = last12Months.map(month => {
    const monthlyStreams = history.filter(stream => {
      try {
        return stream.ts && stream.ts.startsWith(month);
      } catch (error) {
        return false;
      }
    });

    const monthStats = {
      month,
      streams: monthlyStreams.length,
      minutes: monthlyStreams.reduce((acc, stream) => 
        acc + (stream.ms_played ? Math.floor(stream.ms_played / 60000) : 0), 0),
      uniqueArtists: new Set(monthlyStreams
        .map(s => s.master_metadata_album_artist_name)
        .filter(Boolean)).size,
      uniqueTracks: new Set(monthlyStreams
        .map(s => s.master_metadata_track_name)
        .filter(Boolean)).size
    };

    return monthStats;
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
}

function calculateGrowthRate(values) {
  if (values.length < 2) return 0;
  const oldValue = values.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
  const newValue = values.slice(-6).reduce((a, b) => a + b, 0) / 6;
  return oldValue === 0 ? 0 : ((newValue - oldValue) / oldValue) * 100;
}

// Process and export the data
const processedHistoryData = {
  stats: calculateHistoryStats(allHistoryData),
  yearlyStats: calculateYearlyStats(allHistoryData),
  trends: calculateTrends(allHistoryData),
  rawHistory: allHistoryData
};

export default processedHistoryData;