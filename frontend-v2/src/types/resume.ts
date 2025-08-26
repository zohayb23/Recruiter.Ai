export interface Contact {
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Education {
  degree: string;
  institution: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  description?: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string[];
  technologies: string[];
  achievements?: string[];
}

export interface Skill {
  name: string;
  category: string;
  years_of_experience?: number;
  proficiency_level?: string;
}

export interface ParsedResume {
  resume_id: string;
  full_name: string;
  contact: Contact;
  education: Education[];
  work_experience: WorkExperience[];
  skills: Skill[];
  file_path: string;
  created_at: string;
  summary?: string;
  certifications?: string[];
  languages?: string[];
}
