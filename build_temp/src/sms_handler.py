from twilio.rest import Client
import os
from typing import Optional

class SMSHandler:
    def __init__(self):
        # These should be set as environment variables
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_PHONE_NUMBER')
        
        if not all([self.account_sid, self.auth_token, self.from_number]):
            raise ValueError("Missing required Twilio credentials in environment variables")
        
        self.client = Client(self.account_sid, self.auth_token)

    def send_qualified_candidate_sms(self, candidate_phone: str, candidate_name: str, 
                                   interview_date: Optional[str] = None) -> bool:
        """Send SMS to qualified candidates with interview details"""
        message = (
            f"Hi {candidate_name}, congratulations! Your application has been shortlisted. "
        )
        if interview_date:
            message += f"Your interview is scheduled for {interview_date}. "
        message += "We'll send more details via email. Reply CONFIRM to acknowledge."

        return self._send_sms(candidate_phone, message)

    def send_unqualified_candidate_sms(self, candidate_phone: str, candidate_name: str) -> bool:
        """Send SMS to unqualified candidates"""
        message = (
            f"Hi {candidate_name}, thank you for your application. "
            "Unfortunately, we won't be moving forward at this time. "
            "Please check your email for detailed feedback."
        )
        return self._send_sms(candidate_phone, message)

    def _send_sms(self, to_number: str, message: str) -> bool:
        """Internal method to send SMS using Twilio"""
        try:
            message = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            return True
        except Exception as e:
            print(f"Error sending SMS: {str(e)}")
            return False 