from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    PAUSED = "paused"

class EmailCampaign(BaseModel):
    """Email campaign model"""
    id: str
    name: str
    subject: str
    content: str
    template_id: Optional[str] = None
    status: CampaignStatus = CampaignStatus.DRAFT
    created_by: str
    created_at: datetime
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    total_recipients: int = 0
    sent_count: int = 0
    delivered_count: int = 0
    opened_count: int = 0
    clicked_count: int = 0

class CampaignCreateRequest(BaseModel):
    """Request to create a new campaign"""
    name: str
    subject: str
    content: str
    template_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class CampaignUpdateRequest(BaseModel):
    """Request to update a campaign"""
    name: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    template_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class CampaignAnalytics(BaseModel):
    """Campaign analytics and metrics"""
    campaign_id: str
    total_recipients: int
    sent_count: int
    delivered_count: int
    opened_count: int
    clicked_count: int
    bounce_count: int = 0
    unsubscribe_count: int = 0
    open_rate: float = 0.0
    click_rate: float = 0.0
    delivery_rate: float = 0.0
    last_updated: datetime

class EmailTemplate(BaseModel):
    """Email template model"""
    id: str
    name: str
    subject: str
    content: str
    variables: List[str] = []
    created_by: str
    created_at: datetime
    updated_at: datetime

class RecipientProfile(BaseModel):
    """Email recipient profile"""
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime

class SegmentationRule(BaseModel):
    """Segmentation rule for targeting"""
    id: str
    name: str
    field: str
    operator: str  # equals, contains, greater_than, etc.
    value: str
    created_at: datetime

class ABTest(BaseModel):
    """A/B test configuration"""
    id: str
    name: str
    campaign_a_id: str
    campaign_b_id: str
    split_percentage: float = 50.0  # Percentage for campaign A
    test_duration_hours: int = 24
    success_metric: str = "open_rate"  # open_rate, click_rate, conversion_rate
    status: str = "draft"  # draft, running, completed
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    winner: Optional[str] = None  # A or B
