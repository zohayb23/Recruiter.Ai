from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import sqlite3
import json
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Pipeline CRM Backend - Production", version="1.0.0")

# CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to production domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pipeline_crm.db")
DB_PATH = DATABASE_URL.replace("sqlite:///", "")

# Initialize database
def init_database():
    """Initialize the SQLite database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create pipeline stages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pipeline_stages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            order_index INTEGER NOT NULL,
            color TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # Create candidate pipelines table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS candidate_pipelines (
            candidate_id TEXT PRIMARY KEY,
            current_stage TEXT NOT NULL,
            stage_history TEXT NOT NULL,  -- JSON string
            assigned_recruiter TEXT,
            priority_level TEXT DEFAULT 'medium',
            last_activity_date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (current_stage) REFERENCES pipeline_stages (slug)
        )
    ''')
    
    # Create recruiter notes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recruiter_notes (
            id TEXT PRIMARY KEY,
            candidate_id TEXT NOT NULL,
            recruiter_id TEXT NOT NULL,
            content TEXT NOT NULL,
            note_type TEXT DEFAULT 'general',
            is_private BOOLEAN DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (candidate_id) REFERENCES candidate_pipelines (candidate_id)
        )
    ''')
    
    # Create candidate tags table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS candidate_tags (
            id TEXT PRIMARY KEY,
            candidate_id TEXT NOT NULL,
            tag_name TEXT NOT NULL,
            tag_color TEXT DEFAULT '#007bff',
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (candidate_id) REFERENCES candidate_pipelines (candidate_id)
        )
    ''')
    
    # Create interaction logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS interaction_logs (
            id TEXT PRIMARY KEY,
            candidate_id TEXT NOT NULL,
            recruiter_id TEXT NOT NULL,
            interaction_type TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (candidate_id) REFERENCES candidate_pipelines (candidate_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    
    # Initialize default pipeline stages
    initialize_default_stages()

def initialize_default_stages():
    """Initialize default pipeline stages if they don't exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if stages already exist
    cursor.execute("SELECT COUNT(*) FROM pipeline_stages")
    count = cursor.fetchone()[0]
    
    if count == 0:
        default_stages = [
            {"name": "Applied", "slug": "applied", "order": 1, "color": "#6c757d"},
            {"name": "Screening", "slug": "screening", "order": 2, "color": "#ffc107"},
            {"name": "Interview", "slug": "interview", "order": 3, "color": "#17a2b8"},
            {"name": "Offer", "slug": "offer", "order": 4, "color": "#28a745"},
            {"name": "Hired", "slug": "hired", "order": 5, "color": "#007bff"},
            {"name": "Rejected", "slug": "rejected", "order": 6, "color": "#dc3545"},
        ]
        
        now = datetime.utcnow().isoformat()
        for stage_data in default_stages:
            stage_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO pipeline_stages (id, name, slug, order_index, color, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (stage_id, stage_data["name"], stage_data["slug"], stage_data["order"], 
                  stage_data["color"], True, now, now))
        
        print(f"Initialized {len(default_stages)} default pipeline stages.")
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_database()

# Pydantic Models
class PipelineStage(BaseModel):
    id: str
    name: str
    slug: str
    order: int
    color: str
    is_active: bool = True
    created_at: str
    updated_at: str

class CandidatePipeline(BaseModel):
    candidate_id: str
    current_stage: str
    stage_history: List[Dict[str, Any]]
    assigned_recruiter: Optional[str] = None
    priority_level: str = "medium"
    last_activity_date: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class StageTransition(BaseModel):
    candidate_id: str
    from_stage: str
    to_stage: str
    transition_reason: Optional[str] = None
    recruiter_id: Optional[str] = None
    timestamp: str

class RecruiterNote(BaseModel):
    id: Optional[str] = None
    candidate_id: Optional[str] = None
    recruiter_id: str
    content: str
    note_type: str = "general"
    is_private: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CandidateTag(BaseModel):
    id: Optional[str] = None
    candidate_id: Optional[str] = None
    tag_name: str
    tag_color: str = "#007bff"
    created_by: str
    created_at: Optional[str] = None

class InteractionLog(BaseModel):
    id: str
    candidate_id: str
    recruiter_id: str
    interaction_type: str
    content: str
    timestamp: str

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pipeline-crm-backend", "environment": "production"}

# Pipeline Stages Endpoints
@app.get("/api/pipeline-stages", response_model=List[PipelineStage])
async def get_pipeline_stages():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM pipeline_stages WHERE is_active = 1 ORDER BY order_index")
    stages = cursor.fetchall()
    
    conn.close()
    
    stage_list = []
    for stage in stages:
        stage_list.append({
            "id": stage[0],
            "name": stage[1],
            "slug": stage[2],
            "order": stage[3],
            "color": stage[4],
            "is_active": bool(stage[5]),
            "created_at": stage[6],
            "updated_at": stage[7]
        })
    
    return {"stages": stage_list, "total": len(stage_list)}

# Candidate Pipeline Endpoints
@app.post("/api/candidate-pipelines")
async def create_candidate_pipeline(pipeline: CandidatePipeline):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    now = datetime.utcnow().isoformat()
    
    # Insert candidate pipeline
    cursor.execute('''
        INSERT INTO candidate_pipelines (candidate_id, current_stage, stage_history, assigned_recruiter, 
                                       priority_level, last_activity_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (pipeline.candidate_id, pipeline.current_stage, json.dumps(pipeline.stage_history),
          pipeline.assigned_recruiter, pipeline.priority_level, pipeline.last_activity_date, now, now))
    
    # Log the initial creation as an interaction
    interaction_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO interaction_logs (id, candidate_id, recruiter_id, interaction_type, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (interaction_id, pipeline.candidate_id, pipeline.assigned_recruiter or "system",
          "pipeline_created", f"Candidate pipeline created in '{pipeline.current_stage}' stage.", now))
    
    conn.commit()
    conn.close()
    
    return {"success": True, "message": f"Pipeline created for candidate {pipeline.candidate_id}"}

@app.get("/api/candidate-pipelines")
async def get_candidate_pipelines():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM candidate_pipelines")
    pipelines = cursor.fetchall()
    
    conn.close()
    
    pipeline_list = []
    for pipeline in pipelines:
        pipeline_list.append({
            "candidate_id": pipeline[0],
            "current_stage": pipeline[1],
            "stage_history": json.loads(pipeline[2]),
            "assigned_recruiter": pipeline[3],
            "priority_level": pipeline[4],
            "last_activity_date": pipeline[5],
            "created_at": pipeline[6],
            "updated_at": pipeline[7]
        })
    
    return {"pipelines": pipeline_list, "total": len(pipeline_list)}

@app.get("/api/candidate-pipelines/{candidate_id}")
async def get_candidate_pipeline(candidate_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM candidate_pipelines WHERE candidate_id = ?", (candidate_id,))
    pipeline = cursor.fetchone()
    
    conn.close()
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Candidate pipeline not found")
    
    return {
        "success": True,
        "pipeline": {
            "candidate_id": pipeline[0],
            "current_stage": pipeline[1],
            "stage_history": json.loads(pipeline[2]),
            "assigned_recruiter": pipeline[3],
            "priority_level": pipeline[4],
            "last_activity_date": pipeline[5],
            "created_at": pipeline[6],
            "updated_at": pipeline[7]
        }
    }

@app.post("/api/candidate-pipelines/{candidate_id}/transition")
async def transition_candidate_stage(candidate_id: str, transition: StageTransition):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get current pipeline
    cursor.execute("SELECT * FROM candidate_pipelines WHERE candidate_id = ?", (candidate_id,))
    pipeline = cursor.fetchone()
    
    if not pipeline:
        conn.close()
        raise HTTPException(status_code=404, detail="Candidate pipeline not found")
    
    # Validate stage transition
    cursor.execute("SELECT * FROM pipeline_stages WHERE slug = ?", (transition.to_stage,))
    target_stage = cursor.fetchone()
    
    if not target_stage:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid target stage")
    
    # Update pipeline
    stage_history = json.loads(pipeline[2])
    stage_history.append({
        "from_stage": transition.from_stage,
        "to_stage": transition.to_stage,
        "transition_reason": transition.transition_reason,
        "recruiter_id": transition.recruiter_id,
        "timestamp": transition.timestamp
    })
    
    now = datetime.utcnow().isoformat()
    cursor.execute('''
        UPDATE candidate_pipelines 
        SET current_stage = ?, stage_history = ?, last_activity_date = ?, updated_at = ?
        WHERE candidate_id = ?
    ''', (transition.to_stage, json.dumps(stage_history), transition.timestamp, now, candidate_id))
    
    # Log the transition
    interaction_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO interaction_logs (id, candidate_id, recruiter_id, interaction_type, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (interaction_id, candidate_id, transition.recruiter_id or "system",
          "stage_transition", f"Moved from {transition.from_stage} to {transition.to_stage}: {transition.transition_reason}", 
          transition.timestamp))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": f"Candidate moved from {transition.from_stage} to {transition.to_stage}",
        "transition": transition.dict(),
        "pipeline": {
            "candidate_id": candidate_id,
            "current_stage": transition.to_stage,
            "stage_history": stage_history
        }
    }

# Notes Endpoints
@app.post("/api/candidate-pipelines/{candidate_id}/notes")
async def add_candidate_note(candidate_id: str, note: RecruiterNote):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verify candidate exists
    cursor.execute("SELECT candidate_id FROM candidate_pipelines WHERE candidate_id = ?", (candidate_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    note_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    cursor.execute('''
        INSERT INTO recruiter_notes (id, candidate_id, recruiter_id, content, note_type, is_private, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (note_id, candidate_id, note.recruiter_id, note.content, note.note_type, note.is_private, now, now))
    
    # Log the note addition
    interaction_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO interaction_logs (id, candidate_id, recruiter_id, interaction_type, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (interaction_id, candidate_id, note.recruiter_id, "note_added", 
          f"Added {note.note_type} note: {note.content[:50]}...", now))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": "Note created successfully",
        "note": {
            "id": note_id,
            "candidate_id": candidate_id,
            "recruiter_id": note.recruiter_id,
            "content": note.content,
            "note_type": note.note_type,
            "is_private": note.is_private,
            "created_at": now,
            "updated_at": now
        }
    }

@app.get("/api/candidate-pipelines/{candidate_id}/notes")
async def get_candidate_notes(candidate_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM recruiter_notes WHERE candidate_id = ? ORDER BY created_at DESC", (candidate_id,))
    notes = cursor.fetchall()
    
    conn.close()
    
    note_list = []
    for note in notes:
        note_list.append({
            "id": note[0],
            "candidate_id": note[1],
            "recruiter_id": note[2],
            "content": note[3],
            "note_type": note[4],
            "is_private": bool(note[5]),
            "created_at": note[6],
            "updated_at": note[7]
        })
    
    return {"notes": note_list, "total": len(note_list)}

# Tags Endpoints
@app.post("/api/candidate-pipelines/{candidate_id}/tags")
async def add_candidate_tag(candidate_id: str, tag: CandidateTag):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verify candidate exists
    cursor.execute("SELECT candidate_id FROM candidate_pipelines WHERE candidate_id = ?", (candidate_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    tag_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    cursor.execute('''
        INSERT INTO candidate_tags (id, candidate_id, tag_name, tag_color, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (tag_id, candidate_id, tag.tag_name, tag.tag_color, tag.created_by, now))
    
    # Log the tag addition
    interaction_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO interaction_logs (id, candidate_id, recruiter_id, interaction_type, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (interaction_id, candidate_id, tag.created_by, "tag_added", 
          f"Added tag '{tag.tag_name}'", now))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": "Tag created successfully",
        "tag": {
            "id": tag_id,
            "candidate_id": candidate_id,
            "tag_name": tag.tag_name,
            "tag_color": tag.tag_color,
            "created_by": tag.created_by,
            "created_at": now
        }
    }

@app.get("/api/candidate-pipelines/{candidate_id}/tags")
async def get_candidate_tags(candidate_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM candidate_tags WHERE candidate_id = ? ORDER BY created_at DESC", (candidate_id,))
    tags = cursor.fetchall()
    
    conn.close()
    
    tag_list = []
    for tag in tags:
        tag_list.append({
            "id": tag[0],
            "candidate_id": tag[1],
            "tag_name": tag[2],
            "tag_color": tag[3],
            "created_by": tag[4],
            "created_at": tag[5]
        })
    
    return {"tags": tag_list, "total": len(tag_list)}

# Analytics Endpoint
@app.get("/api/pipeline-analytics")
async def get_pipeline_analytics():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get total counts
    cursor.execute("SELECT COUNT(*) FROM candidate_pipelines")
    total_candidates = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM recruiter_notes")
    total_notes = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM candidate_tags")
    total_tags = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM interaction_logs")
    total_interactions = cursor.fetchone()[0]
    
    # Get stage distribution
    cursor.execute('''
        SELECT current_stage, COUNT(*) 
        FROM candidate_pipelines 
        GROUP BY current_stage
    ''')
    stage_distribution = dict(cursor.fetchall())
    
    # Calculate average stage times (simplified)
    average_stage_times = {stage: "0 days" for stage in stage_distribution.keys()}
    
    conn.close()
    
    return {
        "success": True,
        "analytics": {
            "total_candidates": total_candidates,
            "stage_distribution": stage_distribution,
            "average_stage_times": average_stage_times,
            "total_notes": total_notes,
            "total_interactions": total_interactions,
            "total_tags": total_tags
        },
        "message": f"Analytics for {total_candidates} candidates"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8809)
