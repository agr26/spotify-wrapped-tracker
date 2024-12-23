import React, { useState, useEffect } from 'react';
import { Trophy, Music, Clock, Calendar, Star, TrendingUp, Award, Upload, Check, AlertCircle } from 'lucide-react';

// Reusable card component for statistics
const StatCard = ({ icon: Icon, value, label, subValue, trend, progress }) => (
  <div className="bg-[#282828] p-6 rounded-xl shadow-lg hover:bg-[#2a2a2a] transition-all duration-300">
    <div className="text-center">
      <Icon className="w-8 h-8 mx-auto mb-3 text-[#1DB954]" />
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {progress && (
        <div className="mt-2 bg-[#404040] rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-[#1DB954] transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      {subValue && (
        <div className="text-xs text-[#1DB954] mt-2 font-medium">{subValue}</div>
      )}
      {trend && (
        <div className={`text-xs mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs. last month
        </div>
      )}
    </div>
  </div>
);

// Milestone progress component
const ProgressMilestone = ({ title, current, target, description }) => (
  <div className="bg-[#2a2a2a] p-4 rounded-lg">
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium text-white">{title}</span>
      <span className="text-[#1DB954]">{current.toLocaleString()} / {target.toLocaleString()}</span>
    </div>
    <div className="bg-[#404040] rounded-full h-2 mb-2">
      <div 
        className="h-2 rounded-full bg-[#1DB954] transition-all duration-300"
        style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
      />
    </div>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
);

function MainPage({ token }) {
  const [wrappedData, setWrappedData] = useState({
    currentYear: 2025,
    daysElapsed: 0,
    daysRemaining: 0,
    progress: 0,
    milestones: [],
    stats: {
      minutesListened: 0,
      uniqueArtists: 0,
      uniqueTracks: 0,
      totalStreams: 0
    }
  });

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    calculateWrappedProgress();
    fetchSpotifyData();
  }, [token]);

  const calculateWrappedProgress = () => {
    const now = new Date();
    const startDate = new Date(2025, 0, 1);
    const endDate = new Date(2025, 9, 31); // October 31st, 2025
    const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    
    setWrappedData(prev => ({
      ...prev,
      daysElapsed,
      daysRemaining,
      progress: Math.min((daysElapsed / totalDays) * 100, 100)
    }));
  };

  const fetchSpotifyData = async () => {
    try {
      const [tracksResponse, artistsResponse] = await Promise.all([
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [tracksData, artistsData] = await Promise.all([
        tracksResponse.json(),
        artistsResponse.json()
      ]);

      // Update stats with Spotify API data
      setWrappedData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          uniqueArtists: artistsData.items.length,
          uniqueTracks: tracksData.items.length
        }
      }));
    } catch (error) {
      console.error('Error fetching Spotify data:', error);
    }
  };

  const processStreamingHistory = async (files) => {
    const allHistory = [];
    
    for (const file of files) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        allHistory.push(...data);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    // Filter for 2025 only
    const currentYearData = allHistory.filter(item => 
      new Date(item.ts).getFullYear() === 2025
    );
    
    return {
      totalStreams: currentYearData.length,
      totalMinutes: Math.floor(currentYearData.reduce((acc, item) => 
        acc + (item.ms_played / 60000), 0
      )),
      uniqueArtists: new Set(currentYearData.map(item => 
        item.master_metadata_album_artist_name
      )).size,
      uniqueTracks: new Set(currentYearData.map(item => 
        item.master_metadata_track_name
      )).size
    };
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setUploading(true);
    setUploadStatus('processing');

    try {
      const jsonFiles = files.filter(file => file.name.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        throw new Error('No JSON files found');
      }

      const processedData = await processStreamingHistory(jsonFiles);
      updateWrappedData(processedData);
      setUploadStatus('success');
    } catch (error) {
      console.error('Error processing files:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const updateWrappedData = (processedData) => {
    const milestones = [
      {
        title: "Minutes Milestone",
        current: processedData.totalMinutes,
        target: 50000,
        description: "On track to hit your 2025 listening goal"
      },
      {
        title: "Artist Diversity",
        current: processedData.uniqueArtists,
        target: 300,
        description: "Listen to more unique artists in 2025"
      },
      {
        title: "Track Explorer",
        current: processedData.uniqueTracks,
        target: 1000,
        description: "Discover more unique tracks this year"
      }
    ];

    setWrappedData(prev => ({
      ...prev,
      milestones,
      stats: {
        ...prev.stats,
        ...processedData
      }
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-[#1DB954] to-[#179443] rounded-xl shadow-lg mb-6 p-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Wrapped 2025 Progress</h1>
            <div className="text-right">
              <div className="text-lg">{wrappedData.daysRemaining} days until Wrapped</div>
              <div className="text-sm opacity-80">Data collection ends October 31st, 2025</div>
            </div>
          </div>
          <div className="bg-black bg-opacity-20 rounded-full h-3 mb-2">
            <div 
              className="h-3 rounded-full bg-white transition-all duration-300"
              style={{ width: `${wrappedData.progress}%` }}
            />
          </div>
          <div className="text-sm opacity-80">
            {Math.round(wrappedData.progress)}% through the 2025 Wrapped tracking period
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={Clock} 
            value={wrappedData.stats.minutesListened.toLocaleString()}
            label="Minutes Listened"
            progress={30}
            trend={5}
          />
          <StatCard 
            icon={Music} 
            value={wrappedData.stats.uniqueArtists.toLocaleString()}
            label="Unique Artists"
            progress={50}
            trend={8}
          />
          <StatCard 
            icon={Star} 
            value={wrappedData.stats.uniqueTracks.toLocaleString()}
            label="Unique Tracks"
            progress={35}
          />
          <StatCard 
            icon={Trophy} 
            value={wrappedData.stats.totalStreams.toLocaleString()}
            label="Total Streams"
            progress={40}
            trend={3}
          />
        </div>

        {/* Milestones */}
        {wrappedData.milestones.length > 0 && (
          <div className="bg-[#282828] p-6 rounded-xl shadow-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Your 2025 Wrapped Milestones</h2>
            <div className="space-y-4">
              {wrappedData.milestones.map((milestone, index) => (
                <ProgressMilestone key={index} {...milestone} />
              ))}
            </div>
          </div>
        )}

        {/* History Uploader */}
        <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">Upload Spotify History</h3>
            <p className="text-gray-400">
              Upload your 2025 Spotify Extended Streaming History JSON files to track your progress
            </p>
          </div>
          <div className="relative">
            <input
              type="file"
              multiple
              accept=".json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <div className={`
              p-4 border-2 border-dashed rounded-lg
              ${uploading ? 'border-[#1DB954]' : 'border-gray-600'}
              ${uploadStatus === 'success' ? 'border-green-500' : ''}
              ${uploadStatus === 'error' ? 'border-red-500' : ''}
            `}>
              <div className="flex flex-col items-center">
                {uploadStatus === 'success' ? (
                  <Check className="w-8 h-8 text-green-500 mb-2" />
                ) : uploadStatus === 'error' ? (
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                ) : (
                  <Upload className="w-8 h-8 text-[#1DB954] mb-2" />
                )}
                <span className="text-white">
                  {uploading ? 'Processing files...' :
                   uploadStatus === 'success' ? 'Files processed successfully!' :
                   uploadStatus === 'error' ? 'Error processing files' :
                   'Drop JSON files here or click to upload'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;