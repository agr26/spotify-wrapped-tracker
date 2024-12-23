import React, { useState } from 'react';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { processSpotifyHistory } from '../utils/spotifyHistoryProcessor';

const HistoryUploader = ({ onHistoryProcessed }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setUploading(true);
    setUploadStatus('processing');

    try {
      // Filter only JSON files
      const jsonFiles = files.filter(file => file.name.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        throw new Error('No JSON files found');
      }

      const processedData = await processSpotifyHistory(jsonFiles);
      onHistoryProcessed(processedData);
      setUploadStatus('success');
    } catch (error) {
      console.error('Error processing files:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg text-center">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Upload Spotify History</h3>
        <p className="text-gray-400">
          Upload your Spotify Extended Streaming History JSON files to see detailed insights
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
  );
};

export default HistoryUploader;