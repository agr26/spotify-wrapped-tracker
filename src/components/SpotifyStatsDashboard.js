import React from 'react';
import { Clock, Music, BarChart2 } from 'lucide-react';
import { dummyListeningStats, dummyProjection } from '../data/dummyData';

const StatCard = ({ icon: Icon, value, label, subValue }) => (
  <div className="bg-[#282828] p-6 rounded-xl shadow-lg hover:bg-[#2a2a2a] transition-all duration-300">
    <div className="text-center">
      <Icon className="w-8 h-8 mx-auto mb-3 text-[#1DB954]" />
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {subValue && (
        <div className="text-xs text-[#1DB954] mt-2 font-medium">{subValue}</div>
      )}
    </div>
  </div>
);

function SpotifyStatsDashboard() {
  const [activeTab, setActiveTab] = React.useState('overview');

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1DB954] to-[#179443] rounded-xl shadow-lg mb-6 p-8">
          <h1 className="text-3xl font-bold mb-2">Your 2024 Wrapped Progress</h1>
          <p className="text-lg opacity-90">
            {dummyProjection.daysUntilWrapped} days until Wrapped
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-[#282828] rounded-xl p-2 shadow-lg mb-6">
          <div className="flex space-x-2">
            {['overview', 'artists', 'tracks'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[#1DB954] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard 
                  icon={Clock}
                  value={`${Math.floor(dummyListeningStats.totalMinutes / 60)}h`}
                  label="Listening Time"
                  subValue={`Projected: ${Math.floor(dummyProjection.estimatedMinutes / 60)}h`}
                />
                <StatCard 
                  icon={Music}
                  value={dummyListeningStats.uniqueArtists}
                  label="Unique Artists"
                  subValue={`Projected: ${dummyProjection.estimatedArtists}`}
                />
                <StatCard 
                  icon={BarChart2}
                  value={dummyListeningStats.uniqueTracks}
                  label="Unique Tracks"
                />
              </div>

              <div className="bg-[#282828] rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Monthly Listening</h2>
                <div className="space-y-3">
                  {dummyListeningStats.monthlyMinutes.map((data, index) => (
                    <div key={index} 
                         className="flex justify-between p-4 bg-[#2a2a2a] rounded-lg hover:bg-[#303030] transition-all duration-300">
                      <span className="text-gray-300">{data.month}</span>
                      <span className="font-medium text-[#1DB954]">
                        {Math.floor(data.minutes / 60)}h {data.minutes % 60}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'artists' && (
            <div className="bg-[#282828] rounded-xl shadow-lg p-6">
              <div className="space-y-4">
                {dummyListeningStats.topArtists.map((artist, index) => (
                  <div key={index} 
                       className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg hover:bg-[#303030] transition-all duration-300">
                    <div>
                      <div className="font-semibold text-white">{artist.name}</div>
                      <div className="text-sm text-gray-400">{artist.playCount} plays</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#1DB954]">{Math.floor(artist.minutesPlayed / 60)}h listened</div>
                      {artist.isTopArtist && (
                        <div className="text-xs text-[#1DB954] font-medium mt-1">Top 1% of listeners</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tracks' && (
            <div className="bg-[#282828] rounded-xl shadow-lg p-6">
              <div className="space-y-4">
                {dummyListeningStats.topTracks.map((track, index) => (
                  <div key={index} 
                       className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg hover:bg-[#303030] transition-all duration-300">
                    <div>
                      <div className="font-semibold text-white">{track.name}</div>
                      <div className="text-sm text-gray-400">{track.artist}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#1DB954]">{track.playCount} plays</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Last played: {new Date(track.lastPlayed).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpotifyStatsDashboard;