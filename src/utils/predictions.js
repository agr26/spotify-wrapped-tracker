// predictions.js
export const generatePredictions = (stats, timeRange = 'all') => {
    if (!stats) return null;
    // Calculate days until 2025 Wrapped cutoff (October 31, 2025)
    const today = new Date();
    const wrappedCutoff = new Date(2025, 9, 31); // October 31st, 2025
    const daysUntil = Math.max(0, Math.ceil((wrappedCutoff - today) / (1000 * 60 * 60 * 24)));
  
    // Calculate days elapsed based on time range
    const daysElapsed = (() => {
      switch (timeRange) {
        case '30days':
          return 30;
        case '90days':
          return 90;
        case 'year':
          return Math.ceil((today - new Date(today.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24));
        default:
          return Math.ceil(daysUntil * (313 / 365)); // Proportional to remaining days in year
      }
    })();
  
    // Calculate daily rates
    const dailyMinutes = stats.totalMinutes / daysElapsed;
    const dailyArtists = stats.uniqueArtists / daysElapsed;
    const remainingDays = Math.min(daysUntil, 365 - daysElapsed);
  
    // Project end-of-year stats with growth factor
    const growthFactor = 1.1; // Assume 10% growth rate
    const projectedMinutes = Math.round(stats.totalMinutes + (dailyMinutes * remainingDays * growthFactor));
    const projectedArtists = Math.round(stats.uniqueArtists + (dailyArtists * remainingDays * growthFactor));
  
    return {
      estimatedMinutes: projectedMinutes,
      estimatedArtists: projectedArtists,
      currentStats: {
        totalMinutes: stats.totalMinutes,
        totalArtists: stats.uniqueArtists,
        totalTracks: stats.uniqueTracks
      },
      daysUntilWrapped: daysUntil,
      wrappedCutoffDate: wrappedCutoff.toISOString().split('T')[0],
      playsNeededForChanges: {
        tracks: Object.fromEntries(
          (stats.topTracks || [])
            .filter(track => track.position > 5)
            .slice(0, 5)
            .map(track => [track.name, track.playsNeededForTop5])
        ),
        artists: Object.fromEntries(
          (stats.topArtists || [])
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