import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Music, Clock } from 'lucide-react';
import { processStreamingHistory } from './spotifyHistoryProcessor';

const HistoryUploader = ({ onHistoryProcessed }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processingProgress, setProcessingProgress] = useState(0);

  const expectedFiles = [
    'StreamingHistory_music_0.json',
    'StreamingHistory_music_1.json',
    'StreamingHistory_music_2.json',
    'Streaming_History_Audio_2021-2022_0.json',
    'Streaming_History_Audio_2022-2023_1.json',
    'Streaming_History_Audio_2023_2.json',
    'Streaming_History_Audio_2023-2024_3.json',
    'Streaming_History_Audio_2024_4.json',
    'Streaming_History_Audio_2024_5.json'
  ];

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setUploading(true);
    setUploadStatus('processing');
    setProcessingProgress(0);

    try {
      // Filter for streaming history files
      const streamingFiles = files.filter(file => 
        file.name.startsWith('StreamingHistory_') ||
        file.name.startsWith('Streaming_History_Audio_')
      );
      
      if (streamingFiles.length === 0) {
        throw new Error('No streaming history files found');
      }

      // Process files with progress updates
      const processedData = await processStreamingHistory(streamingFiles);
      
      // Update progress as files are processed
      streamingFiles.forEach((_, index) => {
        setProcessingProgress(((index + 1) / streamingFiles.length) * 100);
      });

      onHistoryProcessed(processedData);
      setUploadStatus('success');
    } catch (error) {
      console.error('Error processing files:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
      setProcessingProgress(100);
    }
  };

  const getUploadStatusMessage = () => {
    switch (uploadStatus) {
      case 'processing':
        return `Processing files... ${Math.round(processingProgress)}%`;
      case 'success':
        return 'Files processed successfully!';
      case 'error':
        return 'Error processing files';
      default:
        return 'Drop Spotify streaming history files here or click to upload';
    }
  };

  const renderFileList = () => {
    if (selectedFiles.length === 0) return null;

    return (
      <div className="mt-4 text-left">
        <h4 className="text-white mb-2 font-medium">Selected Files:</h4>
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className={`flex items-center text-sm ${
                expectedFiles.includes(file.name) ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              {file.name}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFileGuide = () => (
    <div className="mt-4 text-left">
      <h4 className="text-white mb-2 font-medium">Recommended Files:</h4>
      <div className="space-y-2">
        {expectedFiles.map((fileName, index) => (
          <div key={index} className="flex items-center text-sm text-gray-400">
            <Music className="w-4 h-4 mr-2" />
            {fileName}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-[#282828] p-6 rounded-xl shadow-lg">
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
          p-6 border-2 border-dashed rounded-lg
          ${uploading ? 'border-[#1DB954]' : 'border-gray-600'}
          ${uploadStatus === 'success' ? 'border-green-500' : ''}
          ${uploadStatus === 'error' ? 'border-red-500' : ''}
        `}>
          <div className="flex flex-col items-center">
            {uploadStatus === 'success' ? (
              <Check className="w-8 h-8 text-green-500 mb-2" />
            ) : uploadStatus === 'error' ? (
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            ) : uploading ? (
              <Clock className="w-8 h-8 text-[#1DB954] mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-[#1DB954] mb-2" />
            )}
            <span className="text-white text-center">
              {getUploadStatusMessage()}
            </span>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-[#404040] rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-[#1DB954] transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {renderFileList()}
      {!selectedFiles.length && renderFileGuide()}

      <div className="mt-4 text-sm text-gray-400">
        <p>Tips:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Upload all streaming history files for the most accurate analysis</li>
          <li>Both regular and extended streaming history files are supported</li>
          <li>Files should be in JSON format</li>
        </ul>
      </div>
    </div>
  );
};

export default HistoryUploader;