import type { User, Job, Candidate } from '../types/api';
import { JobStatus, CandidateStatus } from '../types/api';

export const mockUsers: User[] = [
  {
    username: 'admin',
    role: 'ADMIN'
  }
];

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    description: 'We are looking for a Senior Software Engineer with strong experience in React, Node.js, and cloud technologies. The ideal candidate will have a proven track record of building scalable web applications and mentoring junior developers.',
    requirements: ['5+ years of experience with React', 'Strong knowledge of Node.js', 'Experience with cloud platforms (AWS/GCP)', 'Good communication skills'],
    location: 'San Francisco, CA',
    isRemote: false,
    salary: {
      min: 150000,
      max: 200000,
      currency: 'USD'
    },
    status: JobStatus.PUBLISHED,
    department: 'Engineering',
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'StartupCo',
    description: 'Seeking an experienced Product Manager to lead our core product initiatives. You will work closely with engineering, design, and business teams to define and execute the product roadmap.',
    requirements: ['3+ years of product management experience', 'Experience with B2B SaaS products', 'Strong analytical skills', 'Excellent stakeholder management'],
    location: 'New York, NY',
    isRemote: false,
    salary: {
      min: 130000,
      max: 180000,
      currency: 'USD'
    },
    status: JobStatus.PUBLISHED,
    department: 'Product',
    createdBy: 'admin',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    title: 'UX Designer',
    company: 'DesignStudio',
    description: 'Join our design team to create beautiful and intuitive user experiences. You will be responsible for the entire design process from research to implementation.',
    requirements: ['3+ years of UX design experience', 'Proficiency in Figma', 'Portfolio of web/mobile projects', 'User research experience'],
    location: 'Remote',
    isRemote: true,
    status: JobStatus.PUBLISHED,
    department: 'Design',
    createdBy: 'admin',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  }
];

export const mockCandidates: Candidate[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    currentPosition: 'Senior Software Engineer at Tech Corp',
    experience: 8,
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
    education: [
      {
        institution: 'Stanford University',
        degree: 'Master\'s',
        field: 'Computer Science',
        startDate: '2012-09-01',
        endDate: '2014-06-01'
      }
    ],
    resumeUrl: 'https://example.com/resumes/john-doe.pdf',
    status: CandidateStatus.INTERVIEWING,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 234-5678',
    location: 'New York, NY',
    currentPosition: 'Product Manager at StartupCo',
    experience: 5,
    skills: ['Product Strategy', 'Agile', 'Data Analysis', 'User Research', 'Roadmapping'],
    education: [
      {
        institution: 'Harvard University',
        degree: 'Bachelor\'s',
        field: 'Business Administration',
        startDate: '2014-09-01',
        endDate: '2018-06-01'
      }
    ],
    status: CandidateStatus.SCREENING,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.johnson@example.com',
    phone: '+1 (555) 345-6789',
    location: 'Remote',
    currentPosition: 'Senior UX Designer at DesignStudio',
    experience: 6,
    skills: ['UI/UX Design', 'Figma', 'User Research', 'Prototyping', 'Design Systems'],
    education: [
      {
        institution: 'Rhode Island School of Design',
        degree: 'Bachelor\'s',
        field: 'Graphic Design',
        startDate: '2013-09-01',
        endDate: '2017-06-01'
      }
    ],
    status: CandidateStatus.NEW,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  }
]; 