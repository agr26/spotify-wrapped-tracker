export const dummyListeningStats = {
  totalMinutes: 24150,
  uniqueArtists: 412,
  uniqueTracks: 1250,
  currentTopGenre: "Pop",
  genres: [
    { name: "Pop", percentage: 35, playsNeededForTop: 0 },
    { name: "Hip-Hop", percentage: 30, playsNeededForTop: 50 },
    { name: "Rock", percentage: 20, playsNeededForTop: 150 },
    { name: "Indie", percentage: 10, playsNeededForTop: 250 },
    { name: "Electronic", percentage: 5, playsNeededForTop: 300 }
  ],
  topArtists: [
    { name: 'Taylor Swift', playCount: 150, minutesPlayed: 450, isTopArtist: true, position: 1 },
    { name: 'The Weeknd', playCount: 120, minutesPlayed: 360, isTopArtist: true, position: 2 },
    { name: 'Drake', playCount: 100, minutesPlayed: 300, isTopArtist: false, position: 3 },
    { name: 'Arctic Monkeys', playCount: 80, minutesPlayed: 240, isTopArtist: false, position: 4 },
    { name: 'Doja Cat', playCount: 70, minutesPlayed: 210, isTopArtist: true, position: 5 },
    { name: 'Lana Del Rey', playCount: 65, minutesPlayed: 195, isTopArtist: false, position: 6 },
    { name: 'Kendrick Lamar', playCount: 60, minutesPlayed: 180, isTopArtist: false, position: 7 },
    { name: 'SZA', playCount: 55, minutesPlayed: 165, isTopArtist: false, position: 8 },
    { name: 'Frank Ocean', playCount: 50, minutesPlayed: 150, isTopArtist: false, position: 9 },
    { name: 'Tyler, The Creator', playCount: 45, minutesPlayed: 135, isTopArtist: false, position: 10 }
  ],
  topTracks: [
    { name: 'Anti-Hero', artist: 'Taylor Swift', playCount: 45, lastPlayed: '2024-12-10', position: 1, playsNeededForTop5: 0 },
    { name: 'Blinding Lights', artist: 'The Weeknd', playCount: 38, lastPlayed: '2024-12-09', position: 2, playsNeededForTop5: 0 },
    { name: 'Paint The Town Red', artist: 'Doja Cat', playCount: 32, lastPlayed: '2024-12-11', position: 3, playsNeededForTop5: 0 },
    { name: 'Rich Flex', artist: 'Drake', playCount: 28, lastPlayed: '2024-12-08', position: 4, playsNeededForTop5: 0 },
    { name: 'Kill Bill', artist: 'SZA', playCount: 25, lastPlayed: '2024-12-07', position: 5, playsNeededForTop5: 0 },
    { name: 'Cruel Summer', artist: 'Taylor Swift', playCount: 22, lastPlayed: '2024-12-06', position: 6, playsNeededForTop5: 4 },
    { name: 'Snooze', artist: 'SZA', playCount: 20, lastPlayed: '2024-12-05', position: 7, playsNeededForTop5: 6 },
    { name: 'Karma', artist: 'Taylor Swift', playCount: 18, lastPlayed: '2024-12-04', position: 8, playsNeededForTop5: 8 },
    { name: 'Flowers', artist: 'Miley Cyrus', playCount: 16, lastPlayed: '2024-12-03', position: 9, playsNeededForTop5: 10 },
    { name: 'Vampire', artist: 'Olivia Rodrigo', playCount: 15, lastPlayed: '2024-12-02', position: 10, playsNeededForTop5: 11 }
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
  wrappedCutoffDate: '2024-10-31',
  projectedTopGenre: "Pop",
  playsNeededForChanges: {
    tracks: {
      "Cruel Summer": 4,
      "Snooze": 6,
      "Karma": 8,
      "Flowers": 10,
      "Vampire": 11
    },
    artists: {
      "Lana Del Rey": 10,
      "Kendrick Lamar": 15,
      "SZA": 20
    }
  }
};

export const historicalData = {
  yearComparison: {
    "2022": {
      totalMinutes: 48920,
      uniqueArtists: 756,
      topGenres: ['Hip-Hop', 'Pop', 'Latin'],
      topArtists: ['Drake', 'The Weeknd', 'Bad Bunny']
    },
    "2023": {
      totalMinutes: 52430,
      uniqueArtists: 892,
      topGenres: ['Pop', 'Hip-Hop', 'R&B'],
      topArtists: ['Taylor Swift', 'Drake', 'The Weeknd']
    }
  },
  listeningPatterns: {
    weekday: {
      morning: { percentage: 25, favoriteTracks: ['Anti-Hero', 'Blinding Lights'] },
      afternoon: { percentage: 35, favoriteTracks: ['Paint The Town Red', 'Rich Flex'] },
      evening: { percentage: 40, favoriteTracks: ['Kill Bill', 'Snooze'] }
    },
    weekend: {
      morning: { percentage: 20, favoriteTracks: ['Cruel Summer', 'Karma'] },
      afternoon: { percentage: 45, favoriteTracks: ['Flowers', 'Vampire'] },
      evening: { percentage: 35, favoriteTracks: ['Anti-Hero', 'Blinding Lights'] }
    }
  },
  milestones: [
    {
      title: "Marathon Listener",
      description: "On track for 50,000 minutes",
      progress: 48.3,
      current: 24150,
      target: 50000
    },
    {
      title: "Genre Explorer",
      description: "Discovered 15 new genres",
      progress: 75,
      current: 15,
      target: 20
    },
    {
      title: "Artist Adventurer",
      description: "Listened to 412 different artists",
      progress: 82.4,
      current: 412,
      target: 500
    }
  ]
};