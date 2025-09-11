import { api } from './config';
import type { ParsedResume } from '../../types/resume';

// Transform stored resume data to match ParsedResume interface
const transformStoredResumeToParsedResume = (storedResume: any): ParsedResume => {
  return {
    resume_id: storedResume.resume_id || '',
    full_name: storedResume.full_name || '',
    contact: {
      email: storedResume.email || '',
      phone: storedResume.phone || '',
      linkedin: storedResume.linkedin || undefined,
      github: storedResume.github || undefined,
      website: storedResume.website || undefined,
    },
    education: storedResume.education || [],
    work_experience: storedResume.work_experience || [],
    skills: storedResume.skills || [],
    file_path: storedResume.file_path || '',
    created_at: storedResume.created_at || new Date().toISOString(),
    summary: storedResume.summary || undefined,
    certifications: storedResume.certifications || undefined,
    languages: storedResume.languages || undefined,
  };
};

export interface ResumeParseResponse {
  success: boolean;
  message?: string;
  data?: ParsedResume;
}

export interface BulkResumeParseResponse {
  total_files: number;
  successful_parses: number;
  failed_parses: number;
  results: Array<{
    filename: string;
    status: 'success';
    data: ParsedResume;
  }>;
  errors: Array<{
    filename: string;
    status: 'error';
    error: string;
  }>;
  summary: {
    success_rate: string;
    processed_at: string;
  };
}

export interface BulkParseProgress {
  current: number;
  total: number;
  currentFile: string;
  status: 'processing' | 'completed' | 'error';
}

export const parseResume = async (file: File): Promise<ParsedResume> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    console.log('Starting resume parse for:', file.name);
    
    // Try to parse the resume first
    try {
      const response = await api.post('/api/resume-parser/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 minutes timeout for resume parsing
      });

      console.log('Resume parse response:', response.data);
      
      // If we get here, the parsing was successful
      if (response.data && typeof response.data === 'object') {
        return response.data as ParsedResume;
      } else {
        throw new Error('Invalid response format from backend');
      }
      
    } catch (parseError: any) {
      console.log('Direct parsing failed, trying polling approach:', parseError.message);
      
      // If parsing fails with timeout, try the polling approach
      if (parseError.response?.status === 504 || parseError.code === 'ECONNABORTED') {
        console.log('Starting polling approach for resume:', file.name);
        
        // Start the parsing process (this will timeout but backend will continue)
        try {
          await api.post('/api/resume-parser/parse', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
            timeout: 10000, // Short timeout to just trigger the backend
          });
        } catch (triggerError) {
          // Expected to fail, but backend should have started processing
          console.log('Backend parsing triggered (expected timeout)');
        }
        
        // Now poll for the resume to appear in stored resumes
        const maxAttempts = 30; // 30 attempts
        const pollInterval = 2000; // 2 seconds between attempts
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          console.log(`Polling attempt ${attempt}/${maxAttempts} for resume:`, file.name);
          
          try {
            const storedResumes = await api.get('/api/resume-parser/stored-resumes', {
              timeout: 10000, // 10 second timeout for polling
            });
            
            // Look for the resume by name in the filename
            const resume = storedResumes.data.find((r: any) => {
              // Extract the name from the filename (remove extension and common separators)
              const fileNameWithoutExt = file.name
                .replace(/\.(docx|doc|pdf|txt)$/i, '')
                .replace(/[-_]/g, ' ')
                .toLowerCase();
              
              // Check if the resume name is contained in the filename
              if (r.full_name && fileNameWithoutExt.includes(r.full_name.toLowerCase())) {
                console.log('Found resume by name match:', r.full_name);
                return true;
              }
              
              return false;
            });
            
            // If no name match found, try to get the most recent resume as fallback
            if (!resume && storedResumes.data.length > 0) {
              const mostRecentResume = storedResumes.data[storedResumes.data.length - 1];
              console.log('Using most recent resume as fallback:', mostRecentResume.full_name);
              return transformStoredResumeToParsedResume(mostRecentResume);
            }
            
            if (resume) {
              console.log('Resume found in stored resumes:', resume);
              return transformStoredResumeToParsedResume(resume);
            }
            
            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            
          } catch (pollError) {
            console.log(`Polling attempt ${attempt} failed:`, pollError);
            // Continue polling
          }
        }
        
        throw new Error('Resume parsing completed but could not retrieve the result. Please check the candidates page.');
      }
      
      // Re-throw other errors
      throw parseError;
    }
    
  } catch (error: any) {
    console.error('Resume parsing error:', error);
    
    // If it's a timeout error, provide a helpful message
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Resume parsing is taking longer than expected. Please wait a moment and try again.');
    }
    
    // If it's a 504 Gateway Timeout, the backend might still be processing
    if (error.response?.status === 504) {
      throw new Error('Resume parsing is in progress. Please wait a moment and check the candidates page.');
    }
    
    // If it's a 422 validation error
    if (error.response?.status === 422) {
      throw new Error('Invalid resume format. Please check your file and try again.');
    }
    
    // If it's a 500 server error
    if (error.response?.status === 500) {
      throw new Error('Server error during parsing. Please try again later.');
    }
    
    throw new Error(error.response?.data?.detail || error.message || 'Failed to parse resume');
  }
};

export const parseBulkResumes = async (
  files: File[], 
  onProgress?: (progress: BulkParseProgress) => void
): Promise<BulkResumeParseResponse> => {
  if (!files || files.length === 0) {
    throw new Error('No files provided for bulk parsing');
  }

  if (files.length > 50) {
    throw new Error('Maximum 50 files allowed per batch');
  }

  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    console.log(`Starting bulk resume parse for ${files.length} files`);
    
    // Update progress
    onProgress?.({
      current: 0,
      total: files.length,
      currentFile: 'Starting bulk processing...',
      status: 'processing'
    });

    const response = await api.post('/api/resume-parser/parse-bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for bulk parsing
    });

    console.log('Bulk resume parse response:', response.data);
    
    // Update progress to completed
    onProgress?.({
      current: files.length,
      total: files.length,
      currentFile: 'Bulk processing completed',
      status: 'completed'
    });

    return response.data as BulkResumeParseResponse;
    
  } catch (error: any) {
    console.error('Bulk resume parsing error:', error);
    
    // Update progress to error
    onProgress?.({
      current: 0,
      total: files.length,
      currentFile: 'Bulk processing failed',
      status: 'error'
    });

    // Handle specific error cases
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Bulk resume parsing is taking longer than expected. Please wait a moment and try again.');
    }
    
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.detail || 'Invalid request for bulk parsing');
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error during bulk parsing. Please try again later.');
    }
    
    throw new Error(error.response?.data?.detail || error.message || 'Failed to parse bulk resumes');
  }
};

export const getStoredResumes = async (): Promise<any[]> => {
  try {
    const response = await api.get('/api/resume-parser/stored-resumes');
    // The API returns { total_resumes: number, resumes: [] }
    const resumes = response.data.resumes || [];
    
    // Transform the resume data to match expected frontend format
    return resumes.map((resume: any) => {
      // Handle both new and old data structures
      const transformedResume = {
        resume_id: resume.metadata?.resume_id || resume.resume_id || '',
        full_name: resume.basic_information?.name || resume.full_name || '',
        email: resume.basic_information?.contact?.email || resume.email || '',
        phone: resume.basic_information?.contact?.phone || resume.phone || '',
        skills: Array.isArray(resume.skills?.list) ? resume.skills.list : 
                Array.isArray(resume.skills) ? resume.skills : [],
        education: Array.isArray(resume.education?.list) ? resume.education.list : 
                   Array.isArray(resume.education) ? resume.education : [],
        work_experience: Array.isArray(resume.work_experience) ? resume.work_experience : [],
        file_path: resume.metadata?.file_path || resume.file_path || '',
        created_at: resume.metadata?.uploaded_at || resume.created_at || new Date().toISOString(),
        // Keep original structure for compatibility
        ...resume
      };
      
      return transformedResume;
    });
  } catch (error: any) {
    console.error('Error fetching stored resumes:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Failed to fetch stored resumes');
  }
};