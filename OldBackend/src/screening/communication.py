from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

@dataclass
class EmailConfig:
    smtp_server: str
    smtp_port: int
    sender_email: str
    sender_password: str

class CandidateCommunicator:
    def __init__(self, email_config: EmailConfig):
        """Initialize the communicator with email configuration"""
        self.email_config = email_config
        
    def notify_qualified_candidate(self, candidate_email: str, screening_result: Dict, 
                                 job_details: Dict) -> bool:
        """
        Send notification to qualified candidates
        Returns: bool indicating if email was sent successfully
        """
        subject = f"Congratulations! Next Steps for {job_details['title']} Position"
        
        matched_skills = ', '.join(screening_result['skill_match']['matched_required'])
        preferred_skills = ', '.join(screening_result['skill_match']['matched_preferred'])
        
        body = f"""
        Dear Candidate,

        Great news! We are impressed with your application for the {job_details['title']} position at {job_details['company']}.
        
        Your profile strongly matches our requirements:
        • Strong technical background with {screening_result['experience_match']['total_years']} years of experience
        • Excellent command of required skills: {matched_skills}
        • Additional valuable skills: {preferred_skills}
        • Overall match score: {screening_result['overall_score']}%
        
        Next Steps:
        1. Please reply to this email with your availability for the next two weeks for an initial technical interview
        2. The interview will be approximately 60 minutes
        3. You'll meet with our senior technical team members
        4. We'll discuss your experience with {matched_skills} and explore some technical scenarios
        
        Additional Information:
        • Position: {job_details['title']}
        • Department: {job_details['department']}
        • Location: {job_details['location']}
        • Salary Range: {job_details['salary_range']}
        
        Please review the attached job description and prepare any questions you may have about the role or our company.
        
        We're excited about your potential contribution to {job_details['company']}!
        
        Best regards,
        {job_details['company']} Recruitment Team
        """
        
        return self._send_email(candidate_email, subject, body)
        
    def notify_unqualified_candidate(self, candidate_email: str, screening_result: Dict,
                                   job_details: Dict) -> bool:
        """
        Send notification to candidates who didn't qualify
        Returns: bool indicating if email was sent successfully
        """
        subject = f"Update Regarding Your Application for {job_details['title']}"
        
        # Get improvement recommendations
        recommendations = screening_result.get('recommendations', [])
        recommendations_text = "\n".join([f"• {r}" for r in recommendations])
        
        # Get matched skills to provide positive feedback
        matched_skills = screening_result['skill_match']['matched_required']
        matched_preferred = screening_result['skill_match']['matched_preferred']
        positive_points = []
        
        if matched_skills:
            positive_points.append(f"Strong proficiency in: {', '.join(matched_skills)}")
        if matched_preferred:
            positive_points.append(f"Valuable additional skills: {', '.join(matched_preferred)}")
        if screening_result['experience_match']['total_years'] > 0:
            positive_points.append(f"Professional experience: {screening_result['experience_match']['total_years']} years")
            
        positive_feedback = "\n".join([f"• {p}" for p in positive_points])
        
        body = f"""
        Dear Candidate,

        Thank you for your interest in the {job_details['title']} position at {job_details['company']}.
        
        After careful review of your application, we regret to inform you that we will not be moving 
        forward with your candidacy at this time.
        
        We appreciate the strengths in your profile:
        {positive_feedback}
        
        To help with your job search, here are some suggestions for future applications:
        {recommendations_text}
        
        We encourage you to apply for future positions that match your qualifications. We will keep
        your application on file for 6 months and contact you if a suitable position becomes available.
        
        Best regards,
        {job_details['company']} Recruitment Team
        """
        
        return self._send_email(candidate_email, subject, body)
        
    def schedule_interview(self, candidate_email: str, interview_details: Dict) -> bool:
        """
        Send interview invitation and calendar event
        Returns: bool indicating if email was sent successfully
        """
        subject = f"Interview Scheduled - {interview_details['position']} at {interview_details['company']}"
        
        body = f"""
        Dear Candidate,

        We're excited to confirm your interview for the {interview_details['position']} position!
        
        Interview Details:
        • Date: {interview_details['date'].strftime('%A, %B %d, %Y')}
        • Time: {interview_details['time']}
        • Format: {interview_details['format']}
        
        {self._get_interview_instructions(interview_details)}
        
        What to Prepare:
        • Review your recent projects and be ready to discuss them in detail
        • Prepare examples of your problem-solving approach
        • Have questions ready about the role and company
        • If you have a portfolio or code samples you'd like to share, please have them ready
        
        Need to Reschedule?
        If you need to reschedule, please reply to this email at least 24 hours before the interview time.
        
        We look forward to speaking with you!
        
        Best regards,
        {interview_details['company']} Recruitment Team
        """
        
        return self._send_email(candidate_email, subject, body)
        
    def _send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send email using configured SMTP server"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_config.sender_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Print email for debugging
            print("\nSending email:")
            print(f"From: {msg['From']}")
            print(f"To: {msg['To']}")
            print(f"Subject: {msg['Subject']}")
            print("\nBody:")
            print(body)
            
            # Actually send the email
            with smtplib.SMTP(self.email_config.smtp_server, self.email_config.smtp_port) as server:
                server.starttls()
                server.login(self.email_config.sender_email, self.email_config.sender_password)
                server.send_message(msg)
                print("\nEmail sent successfully!")
            
            return True
        except Exception as e:
            print(f"\nFailed to send email: {str(e)}")
            return False
            
    def _get_interview_instructions(self, interview_details: Dict) -> str:
        """Generate appropriate instructions based on interview format"""
        if interview_details['format'].lower() == 'virtual':
            return f"""
            Technical Setup:
            • Meeting Link: {interview_details.get('meeting_link', 'To be provided')}
            • Please test your audio and video before the interview
            • Ensure you have a stable internet connection
            • Find a quiet, well-lit space for the interview
            • Have a backup phone number ready in case of technical issues
            """
        else:
            return f"""
            Location Details:
            • Address: {interview_details.get('location', 'To be provided')}
            • Please arrive 10-15 minutes early
            • Bring a government-issued photo ID for building access
            • Bring a copy of your resume
            • If you have a portfolio or work samples, feel free to bring them
            """ 