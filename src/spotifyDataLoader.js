import history2021_2022 from './Streaming_History_Audio_2021-2022_0.json';
import history2022_2023 from './Streaming_History_Audio_2022-2023_1.json';
import history2023 from './Streaming_History_Audio_2023_2.json';
import history2023_2024 from './Streaming_History_Audio_2023-2024_3.json';
import history2024_4 from './Streaming_History_Audio_2024_4.json';
import history2024_5 from './Streaming_History_Audio_2024_5.json';

export const loadSpotifyData = () => {
  // Combine all data
  const allData = [
    ...history2021_2022,
    ...history2022_2023,
    ...history2023,
    ...history2023_2024,
    ...history2024_4,
    ...history2024_5
  ];

  // Format the data to match our processor's expectations
  const formattedData = allData
    .filter(item => item.endTime && item.trackName) // Filter out any invalid entries
    .map(item => ({
      ts: item.endTime,
      ms_played: item.msPlayed || 0,
      master_metadata_track_name: item.trackName || 'Unknown Track',
      master_metadata_album_artist_name: item.artistName || 'Unknown Artist',
      master_metadata_album_name: item.albumName || 'Unknown Album'
    }));

  return formattedData;
};