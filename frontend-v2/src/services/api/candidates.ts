import { api } from './config';

export interface WorkExperience {
  company?: string;
  position?: string;
  duration?: string;
  description?: string;
}

export interface Candidate {
  resume_id: string;
  full_name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  skills: string[];
  education: string;
  work_experience: WorkExperience[] | string;
  created_at: string;
}

export interface CandidatesResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  total_pages: number;
}

export interface CandidateSearchParams {
  status?: string;
  skills?: string;
  search?: string;
  minExperience?: number;
  page?: number;
  limit?: number;
}

export const getCandidates = async (params: CandidateSearchParams = {}): Promise<CandidatesResponse> => {
  try {
    // Get data from the working backend endpoint
    const response = await api.get('/api/resume-parser/stored-resumes');
    
    // Transform resume data to candidate format
    const candidates = response.data.map((resume: any) => {
      // Extract skills properly - handle the complex skills structure
      let skills: string[] = [];
      if (resume.skills && Array.isArray(resume.skills)) {
        skills = resume.skills.map((skill: any) => {
          if (typeof skill === 'string') {
            // Handle skills that are already strings
            return skill;
          } else if (skill && typeof skill === 'object' && skill.name) {
            // Handle skills that are objects with name property
            return skill.name;
          }
          return '';
        }).filter(Boolean);
      }
      
      // Extract education
      let education = '';
      if (resume.education && Array.isArray(resume.education) && resume.education.length > 0) {
        education = resume.education.map((edu: any) => edu.degree || edu).join(', ');
      }
      
      // Extract work experience
      let work_experience: any[] = [];
      if (resume.work_experience && Array.isArray(resume.work_experience)) {
        work_experience = resume.work_experience.map((exp: any) => ({
          company: exp.company || '',
          position: exp.title || '',
          duration: `${exp.start_date || ''} to ${exp.end_date || 'Present'}`,
          description: Array.isArray(exp.description) ? exp.description.join(' ') : exp.description || ''
        }));
      }
      
      return {
        resume_id: resume.resume_id || resume.id || 'unknown',
        full_name: resume.full_name || 'Unknown',
        email: resume.email || '',
        phone: resume.phone || '',
        linkedin: resume.linkedin || '',
        github: resume.github || '',
        website: resume.website || '',
        skills: skills,
        education: education,
        work_experience: work_experience,
        created_at: resume.created_at || ''
      };
    });
    
    return {
      candidates,
      total: candidates.length,
      page: 1,
      total_pages: 1
    };
  } catch (error) {
    console.error('Error fetching candidates from stored-resumes:', error);
    
    // Return empty array if API fails
    return {
      candidates: [],
      total: 0,
      page: 1,
      total_pages: 1
    };
  }
};