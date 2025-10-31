from typing import Dict, Any, List
import json
import re
from datetime import datetime

class EvaluationRubric:
    """Intelligent Follow-up Question System"""
    def __init__(self, job_description=None):
        self.job_description = job_description or {}
        self.must_have_skills = self._extract_must_have_skills()
        self.flexible_skills = self._extract_flexible_skills()
        self.rubrics = {
            "technical_skills": {
                "importance": 0.9,
                "slots": {
                    "programming_languages": {"weight": 0.3, "questions": [
                        "What programming languages are you most comfortable with?",
                        "Can you walk me through a complex coding problem you solved recently?",
                        "How do you stay updated with new programming languages and frameworks?"
                    ]},
                    "frameworks_tools": {"weight": 0.25, "questions": [
                        "What frameworks and tools do you work with regularly?",
                        "Tell me about a challenging project where you used [specific framework]",
                        "How do you evaluate and choose between different tools for a project?"
                    ]},
                    "architecture_design": {"weight": 0.2, "questions": [
                        "Can you describe a system architecture you designed?",
                        "How do you approach scalability challenges?",
                        "What design patterns do you commonly use and why?"
                    ]},
                    "problem_solving": {"weight": 0.25, "questions": [
                        "Describe a complex technical problem you solved",
                        "How do you debug issues in production systems?",
                        "What's your approach to troubleshooting under pressure?"
                    ]}
                }
            },
            "experience": {
                "importance": 0.85,
                "slots": {
                    "relevant_projects": {"weight": 0.4, "questions": [
                        "Tell me about your most relevant project experience",
                        "What was your role in [specific project type]?",
                        "How did you contribute to the success of [project]?"
                    ]},
                    "leadership": {"weight": 0.3, "questions": [
                        "Have you led any technical teams or projects?",
                        "How do you mentor junior developers?",
                        "Describe a time you had to make a difficult technical decision"
                    ]},
                    "industry_knowledge": {"weight": 0.3, "questions": [
                        "What trends do you see in [industry]?",
                        "How do you stay current with industry best practices?",
                        "What challenges do you think [industry] will face in the next 5 years?"
                    ]}
                }
            },
            "soft_skills": {
                "importance": 0.7,
                "slots": {
                    "communication": {"weight": 0.4, "questions": [
                        "How do you explain complex technical concepts to non-technical stakeholders?",
                        "Describe a time you had to present technical findings to executives",
                        "How do you handle disagreements with team members?"
                    ]},
                    "collaboration": {"weight": 0.3, "questions": [
                        "Tell me about a time you worked with a difficult team member",
                        "How do you ensure effective collaboration in remote teams?",
                        "Describe your ideal team dynamic"
                    ]},
                    "adaptability": {"weight": 0.3, "questions": [
                        "How do you handle changing requirements mid-project?",
                        "Tell me about a time you had to learn a new technology quickly",
                        "How do you stay motivated during challenging projects?"
                    ]}
                }
            },
            "cultural_fit": {
                "importance": 0.6,
                "slots": {
                    "work_style": {"weight": 0.5, "questions": [
                        "What type of work environment do you thrive in?",
                        "How do you prefer to receive feedback?",
                        "What motivates you most in your work?"
                    ]},
                    "values": {"weight": 0.5, "questions": [
                        "What's most important to you in a company culture?",
                        "How do you balance work and personal life?",
                        "What causes or values are important to you professionally?"
                    ]}
                }
            }
        }
        
        # Seniority-based adjustments
        self.seniority_multipliers = {
            "junior": 0.7,
            "mid": 1.0,
            "senior": 1.3,
            "lead": 1.5,
            "principal": 1.8
        }
        
        # Enhance rubrics with job-specific requirements
        self._enhance_with_job_requirements()
    
    def _extract_must_have_skills(self):
        """Extract must-have skills from job description"""
        if not self.job_description:
            return []
        
        required_skills = []
        job_text = str(self.job_description.get('description', '')).lower()
        
        must_have_indicators = ['required', 'must have', 'essential', 'mandatory', 'prerequisite']
        
        for indicator in must_have_indicators:
            if indicator in job_text:
                required_skills.extend(['Python', 'JavaScript', 'React', 'Node.js', 'SQL'])
                break
        
        return list(set(required_skills))
    
    def _extract_flexible_skills(self):
        """Extract flexible/nice-to-have skills from job description"""
        if not self.job_description:
            return []
        
        flexible_skills = []
        job_text = str(self.job_description.get('description', '')).lower()
        
        flexible_indicators = ['preferred', 'nice to have', 'bonus', 'plus', 'advantageous']
        
        for indicator in flexible_indicators:
            if indicator in job_text:
                flexible_skills.extend(['Docker', 'Kubernetes', 'AWS', 'Machine Learning', 'DevOps'])
                break
        
        return list(set(flexible_skills))
    
    def _enhance_with_job_requirements(self):
        """Enhance rubrics with job-specific requirements"""
        if not self.job_description:
            return
        
        job_title = self.job_description.get('title', '').lower()
        job_description = str(self.job_description.get('description', '')).lower()
        
        if 'frontend' in job_title or 'react' in job_description:
            self.rubrics['technical_skills']['slots']['frontend_specific'] = {
                "weight": 0.4,
                "questions": [
                    "Tell me about your experience with React hooks and state management",
                    "How do you optimize React application performance?",
                    "What's your approach to responsive design and cross-browser compatibility?"
                ]
            }
        
        if 'backend' in job_title or 'api' in job_description:
            self.rubrics['technical_skills']['slots']['backend_specific'] = {
                "weight": 0.4,
                "questions": [
                    "How do you design RESTful APIs?",
                    "Tell me about your experience with database optimization",
                    "What's your approach to API security and authentication?"
                ]
            }
        
        if 'fullstack' in job_title or 'full stack' in job_description:
            self.rubrics['technical_skills']['slots']['fullstack_specific'] = {
                "weight": 0.4,
                "questions": [
                    "How do you handle state management across frontend and backend?",
                    "Tell me about your experience with end-to-end testing",
                    "What's your approach to deployment and CI/CD?"
                ]
            }

    def determine_seniority(self, candidate_data: Dict[str, Any]) -> str:
        """Determine candidate seniority based on experience and skills"""
        try:
            experience_years = candidate_data.get('experience_years', 0)
            if experience_years and experience_years > 0:
                if experience_years >= 10:
                    return "principal"
                elif experience_years >= 7:
                    return "lead"
                elif experience_years >= 4:
                    return "senior"
                elif experience_years >= 2:
                    return "mid"
                else:
                    return "junior"
            
            work_experience = candidate_data.get('work_experience', [])
            if isinstance(work_experience, str):
                work_experience = json.loads(work_experience)
            
            total_years = 0
            leadership_roles = 0
            senior_titles = 0
            
            for exp in work_experience:
                period = exp.get('period', '').lower()
                start_date = exp.get('start_date', '')
                end_date = exp.get('end_date', '')
                
                if 'present' in period or 'present' in end_date.lower() or 'current' in period:
                    total_years += 2
                elif start_date and end_date:
                    try:
                        start = datetime.strptime(start_date, '%b %Y')
                        end = datetime.strptime(end_date, '%b %Y') if end_date.lower() != 'present' else datetime.now()
                        years = (end - start).days / 365.25
                        total_years += max(0, years)
                    except:
                        years_match = re.search(r'(\d+)\s*year', period)
                        if years_match:
                            total_years += int(years_match.group(1))
                else:
                    years_match = re.search(r'(\d+)\s*year', period)
                    if years_match:
                        total_years += int(years_match.group(1))
                
                title = exp.get('title', '').lower()
                if any(word in title for word in ['lead', 'senior', 'principal', 'architect', 'manager', 'director']):
                    senior_titles += 1
                if any(word in title for word in ['lead', 'manager', 'director', 'head']):
                    leadership_roles += 1
            
            if total_years >= 10 or leadership_roles >= 2:
                return "principal"
            elif total_years >= 7 or leadership_roles >= 1 or senior_titles >= 2:
                return "lead"
            elif total_years >= 4 or senior_titles >= 1:
                return "senior"
            elif total_years >= 2:
                return "mid"
            else:
                return "junior"
                
        except Exception as e:
            print(f"Error determining seniority: {e}")
            return "mid"

    def calculate_slot_scores(self, candidate_data: Dict[str, Any], conversation_history: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        """Calculate confidence scores for each slot based on available information"""
        scores = {}
        
        for category, rubric in self.rubrics.items():
            scores[category] = {}
            for slot, config in rubric["slots"].items():
                uncertainty = 1.0
                
                if category == "technical_skills":
                    skills = candidate_data.get('skills', [])
                    if isinstance(skills, str):
                        skills = json.loads(skills)
                    
                    if slot == "programming_languages" and any('python' in skill.lower() or 'java' in skill.lower() or 'javascript' in skill.lower() for skill in skills):
                        uncertainty -= 0.3
                    if slot == "frameworks_tools" and len(skills) > 5:
                        uncertainty -= 0.2
                
                elif category == "experience":
                    work_exp = candidate_data.get('work_experience', [])
                    if isinstance(work_exp, str):
                        work_exp = json.loads(work_exp)
                    
                    if slot == "relevant_projects" and len(work_exp) > 0:
                        uncertainty -= 0.4
                    if slot == "leadership" and any('lead' in exp.get('title', '').lower() or 'senior' in exp.get('title', '').lower() for exp in work_exp):
                        uncertainty -= 0.3
                
                for msg in conversation_history:
                    if msg.get('role') == 'assistant':
                        content = msg.get('content', '').lower()
                        if any(keyword in content for keyword in self._get_slot_keywords(slot)):
                            uncertainty -= 0.2
                
                uncertainty = max(0.0, min(1.0, uncertainty))
                scores[category][slot] = uncertainty
        
        return scores

    def _get_slot_keywords(self, slot: str) -> List[str]:
        """Get keywords that indicate a slot has been discussed"""
        keyword_map = {
            "programming_languages": ["programming", "code", "language", "python", "java", "javascript"],
            "frameworks_tools": ["framework", "tool", "technology", "library"],
            "architecture_design": ["architecture", "design", "system", "scalability"],
            "problem_solving": ["problem", "debug", "troubleshoot", "challenge"],
            "relevant_projects": ["project", "experience", "worked on", "developed"],
            "leadership": ["lead", "team", "mentor", "manage", "direct"],
            "industry_knowledge": ["industry", "trend", "best practice", "standard"],
            "communication": ["explain", "present", "communicate", "stakeholder"],
            "collaboration": ["team", "collaborate", "work together", "difficult"],
            "adaptability": ["change", "learn", "adapt", "flexible"],
            "work_style": ["environment", "work style", "prefer", "motivated"],
            "values": ["culture", "value", "important", "believe"]
        }
        return keyword_map.get(slot, [])

    def get_next_question(self, candidate_data: Dict[str, Any], conversation_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get the next most important question to ask with must-have vs flexible skills algorithm"""
        seniority = self.determine_seniority(candidate_data)
        scores = self.calculate_slot_scores(candidate_data, conversation_history)
        
        weighted_scores = []
        for category, rubric in self.rubrics.items():
            importance = rubric["importance"]
            seniority_mult = self.seniority_multipliers.get(seniority, 1.0)
            is_must_have = self._is_must_have_category(category)
            
            for slot, config in rubric["slots"].items():
                uncertainty = scores[category][slot]
                weight = config["weight"]
                
                if is_must_have:
                    must_have_multiplier = 2.0
                else:
                    flexible_multiplier = 0.7
                
                if is_must_have:
                    final_score = importance * seniority_mult * weight * uncertainty * must_have_multiplier
                else:
                    final_score = importance * seniority_mult * weight * uncertainty * flexible_multiplier
                
                weighted_scores.append({
                    "category": category,
                    "slot": slot,
                    "score": final_score,
                    "uncertainty": uncertainty,
                    "questions": config["questions"],
                    "is_must_have": is_must_have
                })
        
        weighted_scores.sort(key=lambda x: x["score"], reverse=True)
        
        if weighted_scores:
            top_slot = weighted_scores[0]
            import random
            selected_question = random.choice(top_slot["questions"])
            
            if self.job_description:
                job_title = self.job_description.get('title', 'this position')
                selected_question = selected_question.replace('[specific project type]', f'for {job_title}')
                selected_question = selected_question.replace('[project]', f'your {job_title} projects')
                selected_question = selected_question.replace('[industry]', f'{job_title} industry')
            
            return {
                "question": selected_question,
                "category": top_slot["category"],
                "slot": top_slot["slot"],
                "score": top_slot["score"],
                "uncertainty": top_slot["uncertainty"],
                "seniority": seniority,
                "is_must_have": top_slot["is_must_have"]
            }
        
        return {
            "question": "Tell me more about your background and what interests you about this role.",
            "category": "general",
            "slot": "introduction",
            "score": 1.0,
            "uncertainty": 1.0,
            "seniority": seniority,
            "is_must_have": False
        }
    
    def _is_must_have_category(self, category: str) -> bool:
        """Determine if a category contains must-have skills based on job requirements"""
        if not self.job_description:
            return category in ["technical_skills", "experience"]
        
        if category == "technical_skills":
            return True
        
        if category == "experience":
            return True
        
        return False

