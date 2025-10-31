from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CandidateChatRequest(BaseModel):
    candidateId: str
    message: str
    conversationHistory: List[Dict[str, Any]]
    candidateData: Optional[Dict[str, Any]] = None
    jobDescription: Optional[Dict[str, Any]] = None

class TemplateRequest(BaseModel):
    name: str
    subject: str
    content: str
    category: Optional[str] = None

class ExperimentRequest(BaseModel):
    name: str
    description: str
    test_type: str
    test_duration_hours: int
    variants: List[Dict[str, Any]]

class SegmentRequest(BaseModel):
    name: str
    description: str
    rules: List[Dict[str, Any]]

class WorkflowRequest(BaseModel):
    name: str
    description: str
    trigger: Dict[str, Any]
    actions: List[Dict[str, Any]]
    is_active: bool = True

