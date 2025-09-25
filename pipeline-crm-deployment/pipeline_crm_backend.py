from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Recruiter.AI - Pipeline CRM Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PipelineStage(BaseModel):
    id: str
    name: str
    description: str
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
    priority_level: str = "medium"  # low, medium, high, urgent
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
    note_type: str = "general"  # general, interview, feedback, follow_up
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
    interaction_type: str  # email, call, interview, meeting, note
    content: str
    duration_minutes: Optional[int] = None
    outcome: Optional[str] = None
    timestamp: str

# In-memory storage (in production, this would be in a database)
pipeline_stages = [
    {
        "id": "applied",
        "name": "Applied",
        "description": "Candidate has submitted application",
        "order": 1,
        "color": "#6c757d",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "screening",
        "name": "Screening",
        "description": "Initial resume and phone screening",
        "order": 2,
        "color": "#ffc107",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "interview",
        "name": "Interview",
        "description": "Technical and behavioral interviews",
        "order": 3,
        "color": "#17a2b8",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "offer",
        "name": "Offer",
        "description": "Job offer extended",
        "order": 4,
        "color": "#28a745",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "hired",
        "name": "Hired",
        "description": "Candidate accepted offer",
        "order": 5,
        "color": "#007bff",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "rejected",
        "name": "Rejected",
        "description": "Candidate rejected or not selected",
        "order": 6,
        "color": "#dc3545",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
]

candidate_pipelines = {}
recruiter_notes = {}
candidate_tags = {}
interaction_logs = {}

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pipeline-crm-backend"}

# Pipeline Stages Management
@app.get("/api/pipeline-stages")
async def get_pipeline_stages():
    """Get all pipeline stages"""
    return {
        "stages": sorted(pipeline_stages, key=lambda x: x["order"]),
        "total": len(pipeline_stages),
        "message": f"Found {len(pipeline_stages)} pipeline stages"
    }

@app.post("/api/pipeline-stages")
async def create_pipeline_stage(stage: PipelineStage):
    """Create a new pipeline stage"""
    try:
        # Check if stage ID already exists
        if any(s["id"] == stage.id for s in pipeline_stages):
            raise HTTPException(status_code=400, detail="Stage ID already exists")
        
        stage_data = stage.dict()
        stage_data["created_at"] = datetime.now().isoformat()
        stage_data["updated_at"] = datetime.now().isoformat()
        
        pipeline_stages.append(stage_data)
        
        return {
            "success": True,
            "stage": stage_data,
            "message": f"Pipeline stage '{stage.name}' created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create pipeline stage: {str(e)}")

@app.put("/api/pipeline-stages/{stage_id}")
async def update_pipeline_stage(stage_id: str, stage: PipelineStage):
    """Update a pipeline stage"""
    try:
        stage_index = next((i for i, s in enumerate(pipeline_stages) if s["id"] == stage_id), None)
        if stage_index is None:
            raise HTTPException(status_code=404, detail="Pipeline stage not found")
        
        stage_data = stage.dict()
        stage_data["updated_at"] = datetime.now().isoformat()
        stage_data["created_at"] = pipeline_stages[stage_index]["created_at"]  # Preserve original creation date
        
        pipeline_stages[stage_index] = stage_data
        
        return {
            "success": True,
            "stage": stage_data,
            "message": f"Pipeline stage '{stage.name}' updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update pipeline stage: {str(e)}")

@app.delete("/api/pipeline-stages/{stage_id}")
async def delete_pipeline_stage(stage_id: str):
    """Delete a pipeline stage"""
    try:
        stage_index = next((i for i, s in enumerate(pipeline_stages) if s["id"] == stage_id), None)
        if stage_index is None:
            raise HTTPException(status_code=404, detail="Pipeline stage not found")
        
        # Check if any candidates are in this stage
        candidates_in_stage = [cp for cp in candidate_pipelines.values() if cp["current_stage"] == stage_id]
        if candidates_in_stage:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete stage. {len(candidates_in_stage)} candidates are currently in this stage"
            )
        
        deleted_stage = pipeline_stages.pop(stage_index)
        
        return {
            "success": True,
            "deleted_stage": deleted_stage,
            "message": f"Pipeline stage '{deleted_stage['name']}' deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete pipeline stage: {str(e)}")

# Candidate Pipeline Management
@app.get("/api/candidate-pipelines")
async def get_candidate_pipelines():
    """Get all candidate pipelines"""
    return {
        "pipelines": list(candidate_pipelines.values()),
        "total": len(candidate_pipelines),
        "message": f"Found {len(candidate_pipelines)} candidate pipelines"
    }

@app.get("/api/candidate-pipelines/{candidate_id}")
async def get_candidate_pipeline(candidate_id: str):
    """Get pipeline status for a specific candidate"""
    if candidate_id not in candidate_pipelines:
        raise HTTPException(status_code=404, detail="Candidate pipeline not found")
    
    return {
        "success": True,
        "pipeline": candidate_pipelines[candidate_id],
        "message": "Candidate pipeline found"
    }

@app.post("/api/candidate-pipelines")
async def create_candidate_pipeline(pipeline: CandidatePipeline):
    """Create or update a candidate pipeline"""
    try:
        pipeline_data = pipeline.dict()
        pipeline_data["updated_at"] = datetime.now().isoformat()
        
        if pipeline.candidate_id not in candidate_pipelines:
            pipeline_data["created_at"] = datetime.now().isoformat()
        else:
            pipeline_data["created_at"] = candidate_pipelines[pipeline.candidate_id]["created_at"]
        
        candidate_pipelines[pipeline.candidate_id] = pipeline_data
        
        return {
            "success": True,
            "pipeline": pipeline_data,
            "message": f"Pipeline created for candidate {pipeline.candidate_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create candidate pipeline: {str(e)}")

@app.post("/api/candidate-pipelines/{candidate_id}/transition")
async def transition_candidate_stage(candidate_id: str, transition: StageTransition):
    """Transition a candidate to a new stage"""
    try:
        if candidate_id not in candidate_pipelines:
            raise HTTPException(status_code=404, detail="Candidate pipeline not found")
        
        # Validate stage exists
        stage_ids = [s["id"] for s in pipeline_stages]
        if transition.to_stage not in stage_ids:
            raise HTTPException(status_code=400, detail="Invalid target stage")
        
        # Update pipeline
        pipeline = candidate_pipelines[candidate_id]
        old_stage = pipeline["current_stage"]
        
        # Add to stage history
        history_entry = {
            "from_stage": old_stage,
            "to_stage": transition.to_stage,
            "transition_reason": transition.transition_reason,
            "recruiter_id": transition.recruiter_id,
            "timestamp": transition.timestamp
        }
        
        pipeline["stage_history"].append(history_entry)
        pipeline["current_stage"] = transition.to_stage
        pipeline["last_activity_date"] = transition.timestamp
        pipeline["updated_at"] = datetime.now().isoformat()
        
        # Log interaction
        interaction = {
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "recruiter_id": transition.recruiter_id or "system",
            "interaction_type": "stage_transition",
            "content": f"Moved from {old_stage} to {transition.to_stage}",
            "outcome": transition.transition_reason,
            "timestamp": transition.timestamp
        }
        interaction_logs[interaction["id"]] = interaction
        
        return {
            "success": True,
            "pipeline": pipeline,
            "transition": history_entry,
            "message": f"Candidate moved from {old_stage} to {transition.to_stage}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to transition candidate: {str(e)}")

# Recruiter Notes Management
@app.get("/api/candidate-pipelines/{candidate_id}/notes")
async def get_candidate_notes(candidate_id: str):
    """Get all notes for a candidate"""
    candidate_notes = [note for note in recruiter_notes.values() if note["candidate_id"] == candidate_id]
    return {
        "notes": sorted(candidate_notes, key=lambda x: x["created_at"], reverse=True),
        "total": len(candidate_notes),
        "message": f"Found {len(candidate_notes)} notes for candidate {candidate_id}"
    }

@app.post("/api/candidate-pipelines/{candidate_id}/notes")
async def create_candidate_note(candidate_id: str, note: RecruiterNote):
    """Create a new note for a candidate"""
    try:
        note_data = note.dict()
        note_data["candidate_id"] = candidate_id
        note_data["id"] = str(uuid.uuid4())
        note_data["created_at"] = datetime.now().isoformat()
        note_data["updated_at"] = datetime.now().isoformat()
        
        recruiter_notes[note_data["id"]] = note_data
        
        # Log interaction
        interaction = {
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "recruiter_id": note.recruiter_id,
            "interaction_type": "note",
            "content": f"Added {note.note_type} note: {note.content[:100]}...",
            "timestamp": note_data["created_at"]
        }
        interaction_logs[interaction["id"]] = interaction
        
        return {
            "success": True,
            "note": note_data,
            "message": "Note created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")

# Candidate Tags Management
@app.get("/api/candidate-pipelines/{candidate_id}/tags")
async def get_candidate_tags(candidate_id: str):
    """Get all tags for a candidate"""
    candidate_tag_list = [tag for tag in candidate_tags.values() if tag["candidate_id"] == candidate_id]
    return {
        "tags": candidate_tag_list,
        "total": len(candidate_tag_list),
        "message": f"Found {len(candidate_tag_list)} tags for candidate {candidate_id}"
    }

@app.post("/api/candidate-pipelines/{candidate_id}/tags")
async def create_candidate_tag(candidate_id: str, tag: CandidateTag):
    """Create a new tag for a candidate"""
    try:
        tag_data = tag.dict()
        tag_data["candidate_id"] = candidate_id
        tag_data["id"] = str(uuid.uuid4())
        tag_data["created_at"] = datetime.now().isoformat()
        
        candidate_tags[tag_data["id"]] = tag_data
        
        return {
            "success": True,
            "tag": tag_data,
            "message": "Tag created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create tag: {str(e)}")

@app.delete("/api/candidate-pipelines/{candidate_id}/tags/{tag_id}")
async def delete_candidate_tag(candidate_id: str, tag_id: str):
    """Delete a tag from a candidate"""
    try:
        if tag_id not in candidate_tags:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        if candidate_tags[tag_id]["candidate_id"] != candidate_id:
            raise HTTPException(status_code=400, detail="Tag does not belong to this candidate")
        
        deleted_tag = candidate_tags.pop(tag_id)
        
        return {
            "success": True,
            "deleted_tag": deleted_tag,
            "message": "Tag deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete tag: {str(e)}")

# Interaction History
@app.get("/api/candidate-pipelines/{candidate_id}/interactions")
async def get_candidate_interactions(candidate_id: str):
    """Get interaction history for a candidate"""
    candidate_interactions = [log for log in interaction_logs.values() if log["candidate_id"] == candidate_id]
    return {
        "interactions": sorted(candidate_interactions, key=lambda x: x["timestamp"], reverse=True),
        "total": len(candidate_interactions),
        "message": f"Found {len(candidate_interactions)} interactions for candidate {candidate_id}"
    }

# Pipeline Analytics
@app.get("/api/pipeline-analytics")
async def get_pipeline_analytics():
    """Get pipeline analytics and statistics"""
    try:
        total_candidates = len(candidate_pipelines)
        stage_counts = {}
        
        for stage in pipeline_stages:
            stage_counts[stage["id"]] = len([
                cp for cp in candidate_pipelines.values() 
                if cp["current_stage"] == stage["id"]
            ])
        
        # Calculate average time in each stage (simplified)
        stage_times = {}
        for stage_id in stage_counts:
            stage_times[stage_id] = "0 days"  # Placeholder for now
        
        return {
            "success": True,
            "analytics": {
                "total_candidates": total_candidates,
                "stage_distribution": stage_counts,
                "average_stage_times": stage_times,
                "total_notes": len(recruiter_notes),
                "total_interactions": len(interaction_logs),
                "total_tags": len(candidate_tags)
            },
            "message": "Pipeline analytics retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8809)
