import React, { useState } from 'react';
import {
  Home,
  BarChart3,
  Users,
  Briefcase,
  Mail,
  User,
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  FlaskConical,
  Filter,
  Zap,
  ExternalLink,
  Target,
  Copy,
  Hash,
  Search,
  Database,
  Upload
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      jobs: true,
      candidates: true,
      marketing: true,
      ai: true,
      database: true
    });

  const menuSections = [
    {
      id: 'jobs',
      label: 'Job Management',
      icon: Briefcase,
      items: [
        { id: 'job-listings', label: 'Job Listings', icon: BarChart3 },
        { id: 'job-creation', label: 'Create Job', icon: Plus },
        { id: 'external-jobs', label: 'External Jobs', icon: ExternalLink },
      ]
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: Users,
        items: [
          { id: 'candidates', label: 'Candidates', icon: Users },
          { id: 'candidate-profile', label: 'Candidate Profile', icon: User },
          { id: 'candidate-scoring', label: 'Candidate Scoring', icon: Target },
          { id: 'duplicate-detection', label: 'Duplicate Detection', icon: Copy },
          { id: 'gap-analysis', label: 'Gap Analysis', icon: BarChart3 },
          { id: 'resume-parsing', label: 'Resume Parser', icon: FileText },
        ]
    },
    {
      id: 'marketing',
      label: 'Marketing & CRM',
      icon: Mail,
      items: [
        { id: 'pipeline-crm', label: 'Pipeline CRM', icon: Briefcase },
        { id: 'mailing', label: 'Mass Mailing', icon: Mail },
        { id: 'ab-testing', label: 'A/B Testing', icon: FlaskConical },
        { id: 'segmentation', label: 'Segmentation', icon: Filter },
        { id: 'automation', label: 'Automation', icon: Zap },
      ]
    },
      {
        id: 'ai',
        label: 'AI Features',
        icon: FlaskConical,
        items: [
          { id: 'semantic-search', label: 'Semantic Search', icon: BarChart3 },
          { id: 'keyword-generator', label: 'Keyword Generator', icon: Hash },
          { id: 'enhanced-search', label: 'Enhanced Search', icon: Search },
        ]
      },
      {
        id: 'database',
        label: 'Database',
        icon: Database,
        items: [
          { id: 'milvus-database', label: 'Milvus Database', icon: Database },
        ]
      }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 h-screen flex flex-col overflow-hidden shadow-2xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-indigo-600/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Recruiter.AI</h1>
            <p className="text-blue-300 text-xs">Recruitment Platform</p>
          </div>
        </div>
      </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 pb-6 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Overview - Always visible */}
          <button
            onClick={() => onPageChange('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              activePage === 'dashboard'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-indigo-600/20 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Home size={20} />
              <span className="font-medium">Overview</span>
            </div>
            {activePage === 'dashboard' && <ChevronRight size={16} />}
          </button>

          {/* Collapsible Sections */}
          {menuSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections[section.id];
            const hasActiveItem = section.items.some(item => item.id === activePage);

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                    hasActiveItem
                      ? 'bg-gradient-to-r from-blue-500/30 to-indigo-600/30 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-indigo-600/20 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <SectionIcon size={20} />
                    <span className="font-medium">{section.label}</span>
                  </div>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* Section Items */}
                {isExpanded && (
                  <div className="ml-4 space-y-1">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = activePage === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onPageChange(item.id)}
                          className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                              : 'text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-indigo-600/20 hover:shadow-lg'
                          }`}
                        >
                          <ItemIcon size={16} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        </nav>
    </div>
  );
};

export default Sidebar;
