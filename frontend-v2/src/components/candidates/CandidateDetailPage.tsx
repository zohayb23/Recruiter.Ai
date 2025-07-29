import React from 'react';
import { Box, Container, Tab, Tabs } from '@mui/material';
import ProfileSummaryView from './ProfileSummaryView';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`candidate-tabpanel-${index}`}
      aria-labelledby={`candidate-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `candidate-tab-${index}`,
    'aria-controls': `candidate-tabpanel-${index}`,
  };
}

export const CandidateDetailPage: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);

  // This would come from your API/state management
  const candidateData = {
    resume_id: "res_123",
    full_name: "John Doe",
    contact: {
      email: "john@example.com",
      phone: "123-456-7890",
      linkedin: "linkedin.com/in/johndoe",
      github: "github.com/johndoe"
    },
    professional_summary: "Experienced Senior Software Engineer with 8+ years of industry experience. Proficient in Python, React, and cloud technologies. Led multiple successful projects and teams.",
    work_experience: [
      {
        title: "Senior Software Engineer",
        company: "Tech Corp",
        start_date: "2020-01-01",
        end_date: "2023-12-31",
        description: [
          "Led a team of 5 engineers in developing a microservices architecture",
          "Improved system performance by 50% through optimization",
          "Implemented CI/CD pipeline reducing deployment time by 70%"
        ],
        technologies: ["Python", "React", "AWS", "Docker", "Kubernetes"]
      },
      {
        title: "Software Engineer",
        company: "StartupCo",
        start_date: "2018-01-01",
        end_date: "2019-12-31",
        description: [
          "Developed and maintained multiple full-stack applications",
          "Implemented real-time data processing pipeline"
        ],
        technologies: ["JavaScript", "Node.js", "MongoDB", "Redis"]
      }
    ],
    education: [
      {
        degree: "Master's in Computer Science",
        institution: "Tech University",
        start_date: "2016-09-01",
        end_date: "2018-05-31",
        gpa: 3.8,
        description: "Focus on Distributed Systems and Machine Learning"
      },
      {
        degree: "Bachelor's in Computer Engineering",
        institution: "Engineering College",
        start_date: "2012-09-01",
        end_date: "2016-05-31",
        gpa: 3.7
      }
    ],
    skills: [
      {
        name: "Python",
        category: "Programming Languages",
        level: "Expert",
        years_of_experience: 8
      },
      {
        name: "React",
        category: "Frontend",
        level: "Expert",
        years_of_experience: 5
      },
      {
        name: "AWS",
        category: "Cloud",
        level: "Advanced",
        years_of_experience: 4
      },
      {
        name: "Docker",
        category: "DevOps",
        level: "Advanced",
        years_of_experience: 4
      },
      {
        name: "Kubernetes",
        category: "DevOps",
        level: "Intermediate",
        years_of_experience: 2
      }
    ],
    file_path: "uploads/resumes/john_doe_resume.pdf",
    created_at: "2025-07-24T12:00:00Z"
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="candidate tabs">
            <Tab label="Profile" {...a11yProps(0)} />
            <Tab label="Assessments" {...a11yProps(1)} />
            <Tab label="Interviews" {...a11yProps(2)} />
            <Tab label="Documents" {...a11yProps(3)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <ProfileSummaryView resumeData={candidateData} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          Assessments Content
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          Interviews Content
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          Documents Content
        </TabPanel>
      </Box>
    </Container>
  );
};

export default CandidateDetailPage; 