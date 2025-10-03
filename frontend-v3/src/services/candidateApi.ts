import axios from 'axios';

const API_BASE_URL = 'http://localhost:8804';

// Create axios instance for candidate API calls
const candidateApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for candidate data
export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: 'Applied' | 'Shortlisted' | 'Interviewed' | 'Rejected';
  jobMatchScore: number;
  experienceYears: string;
  skills: string[];
  lastActivity: string;
  resumeId: string;
  position: string;
  description?: string;
  linkedin?: string;
  github?: string;
  videoScore?: number;
  resumeScore?: number;
  interviews?: number;
  attempts?: number;
  experience?: Array<{
    title: string;
    company: string;
    period: string;
    description: string[];
    skills: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    period: string;
    gpa: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  videoInterviews?: Array<{
    question: string;
    duration: string;
    score: number;
    insights: string[];
  }>;
  uploadedDate?: string;
  fileName?: string;
}

export interface ResumeData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  education: Array<{
    degree: string;
    institution: string;
    period: string;
    gpa?: string;
  }>;
  work_experience: Array<{
    title: string;
    company: string;
    period: string;
    description: string[];
    skills: string[];
  }>;
  skills: string[];
  summary: string;
  uploaded_at: string;
  file_name: string;
}

// API functions
export const candidateApiService = {
  // Get all candidates from Milvus
  async getAllCandidates(): Promise<Candidate[]> {
    try {
      const response = await candidateApi.get('/api/candidates');
      const candidatesData = response.data.candidates;
      
      // Transform Milvus candidate data to frontend format
      return candidatesData.map((candidate: any) => ({
        id: candidate.id,
        name: candidate.name || 'Unknown',
        email: candidate.email || 'No email provided',
        phone: candidate.phone || 'N/A',
        location: candidate.location || 'Unknown',
        status: candidate.status || 'Applied',
        jobMatchScore: candidate.score || 85,
        experienceYears: candidate.experience_years?.toString() || '0',
        skills: candidate.skills || [],
        lastActivity: new Date(candidate.created_at).toISOString().split('T')[0],
        resumeId: candidate.id,
        position: this.inferPositionFromCandidate(candidate),
        description: candidate.summary,
        experience: Array.isArray(candidate.work_experience) ? candidate.work_experience.map((exp: any) => ({
          title: exp?.title || 'Unknown',
          company: exp?.company || 'Unknown',
          period: exp?.period || 'Unknown',
          description: exp?.description || '',
          skills: exp?.skills || []
        })) : [],
        education: Array.isArray(candidate.education) ? candidate.education.map((edu: any) => ({
          degree: edu?.degree || 'Unknown',
          institution: edu?.institution || 'Unknown',
          period: edu?.period || 'Unknown',
          gpa: edu?.gpa || 'N/A'
        })) : [],
        uploadedDate: new Date(candidate.created_at).toISOString().split('T')[0],
        fileName: candidate.file_name || 'resume.pdf'
      }));
    } catch (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }
  },

  // Get candidate by ID
  async getCandidateById(id: string): Promise<Candidate | null> {
    try {
      const candidates = await this.getAllCandidates();
      return candidates.find(candidate => candidate.id === id) || null;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      throw error;
    }
  },

  // Search candidates
  async searchCandidates(query: string): Promise<Candidate[]> {
    try {
      const candidates = await this.getAllCandidates();
      return candidates.filter(candidate => 
        candidate.name.toLowerCase().includes(query.toLowerCase()) ||
        candidate.email.toLowerCase().includes(query.toLowerCase()) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching candidates:', error);
      throw error;
    }
  },

  // Filter candidates by status
  async getCandidatesByStatus(status: string): Promise<Candidate[]> {
    try {
      const candidates = await this.getAllCandidates();
      if (status === 'all') return candidates;
      return candidates.filter(candidate => candidate.status.toLowerCase() === status.toLowerCase());
    } catch (error) {
      console.error('Error filtering candidates:', error);
      throw error;
    }
  },

  // Get candidate statistics
  async getCandidateStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    averageScore: number;
    topSkills: string[];
  }> {
    try {
      const candidates = await this.getAllCandidates();
      const total = candidates.length;
      
      const byStatus = candidates.reduce((acc, candidate) => {
        acc[candidate.status] = (acc[candidate.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const averageScore = candidates.reduce((sum, candidate) => sum + candidate.jobMatchScore, 0) / total;
      
      const skillCounts = candidates.reduce((acc, candidate) => {
        candidate.skills.forEach(skill => {
          acc[skill] = (acc[skill] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      const topSkills = Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([skill]) => skill);
      
      return {
        total,
        byStatus,
        averageScore: Math.round(averageScore),
        topSkills
      };
    } catch (error) {
      console.error('Error getting candidate stats:', error);
      throw error;
    }
  },

  // Helper functions
  getRandomStatus(): 'Applied' | 'Shortlisted' | 'Interviewed' | 'Rejected' {
    const statuses = ['Applied', 'Shortlisted', 'Interviewed', 'Rejected'];
    return statuses[Math.floor(Math.random() * statuses.length)] as any;
  },

  calculateJobMatchScore(resume: ResumeData): number {
    // Simple scoring algorithm based on resume completeness and skills
    let score = 50; // Base score
    
    if (resume.full_name) score += 10;
    if (resume.email) score += 10;
    if (resume.phone) score += 5;
    if (resume.location) score += 5;
    if (resume.summary) score += 10;
    if (resume.skills && resume.skills.length > 0) score += Math.min(resume.skills.length * 2, 20);
    if (resume.work_experience && resume.work_experience.length > 0) score += Math.min(resume.work_experience.length * 5, 15);
    if (resume.education && resume.education.length > 0) score += 10;
    
    return Math.min(Math.max(score, 0), 100);
  },

  calculateExperience(workExperience: any[]): string {
    if (!workExperience || workExperience.length === 0) return '0 years';
    
    // Simple calculation - could be improved with date parsing
    const years = workExperience.length;
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  },

  inferPosition(resume: ResumeData): string {
    if (!resume.work_experience || resume.work_experience.length === 0) {
      return 'Entry Level';
    }
    
    const latestJob = resume.work_experience[0];
    const title = latestJob.title.toLowerCase();
    
    if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
      return 'Senior Level';
    } else if (title.includes('junior') || title.includes('entry') || title.includes('associate')) {
      return 'Junior Level';
    } else if (title.includes('manager') || title.includes('director')) {
      return 'Management Level';
    } else {
      return 'Mid Level';
    }
  },

  inferPositionFromCandidate(candidate: any): string {
    if (!Array.isArray(candidate.work_experience) || candidate.work_experience.length === 0) {
      return 'Entry Level';
    }
    
    const latestJob = candidate.work_experience[0];
    if (!latestJob || !latestJob.title || typeof latestJob.title !== 'string') {
      return 'Entry Level';
    }
    
    const title = latestJob.title.toLowerCase();
    
    if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
      return 'Senior Level';
    } else if (title.includes('junior') || title.includes('entry') || title.includes('associate')) {
      return 'Junior Level';
    } else if (title.includes('manager') || title.includes('director')) {
      return 'Management Level';
    } else {
      return 'Mid Level';
    }
  }
};

export default candidateApiService;