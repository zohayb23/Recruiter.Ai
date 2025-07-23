import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseResume, type ResumeParseResponse } from '../../services/api/resumeParser';

interface ResumeUploaderProps {
  onParseComplete: (result: ResumeParseResponse) => void;
  onError: (error: Error) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onParseComplete, onError }) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);

    try {
      const result = await parseResume(file);
      onParseComplete(result);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to parse resume'));
    } finally {
      setIsUploading(false);
    }
  }, [onParseComplete, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600">Parsing resume...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl text-gray-400">
              <i className="fas fa-file-upload"></i>
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
              </p>
              <p className="text-sm text-gray-500">
                or click to select a file
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: PDF, DOCX, DOC, TXT
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploader; 