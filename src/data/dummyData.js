export const dummyListeningStats = {
    totalMinutes: 24150,
    uniqueArtists: 412,
    uniqueTracks: 1250,
    topArtists: [
      { name: 'Taylor Swift', playCount: 150, minutesPlayed: 450, isTopArtist: true },
      { name: 'The Weeknd', playCount: 120, minutesPlayed: 360, isTopArtist: true },
      { name: 'Drake', playCount: 100, minutesPlayed: 300, isTopArtist: false },
      { name: 'Arctic Monkeys', playCount: 80, minutesPlayed: 240, isTopArtist: false },
      { name: 'Doja Cat', playCount: 70, minutesPlayed: 210, isTopArtist: true }
    ],
    topTracks: [
      { name: 'Anti-Hero', artist: 'Taylor Swift', playCount: 45, lastPlayed: '2024-12-10', minutesPlayed: 135 },
      { name: 'Blinding Lights', artist: 'The Weeknd', playCount: 38, lastPlayed: '2024-12-09', minutesPlayed: 114 },
      { name: 'Paint The Town Red', artist: 'Doja Cat', playCount: 32, lastPlayed: '2024-12-11', minutesPlayed: 96 }
    ],
    monthlyMinutes: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
      minutes: Math.floor(Math.random() * 4000) + 1000
    }))
  };
  
  export const dummyProjection = {
    estimatedMinutes: 48300,
    estimatedArtists: 824,
    daysUntilWrapped: 324,
    wrappedCutoffDate: '2024-10-31'
  };