"""
CRM Routes - Handle all CRM-related endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import uuid
from datetime import datetime

from ..storage import crm_pipeline, candidate_notes, candidate_tags, engagement_history

router = APIRouter(prefix="/api/crm", tags=["CRM"])

@router.get("/pipeline")
async def get_crm_pipeline():
    """Get the current CRM pipeline stages and candidates"""
    return crm_pipeline

@router.post("/pipeline/move-candidate")
async def move_candidate_to_stage(data: Dict[str, Any]):
    """Move a candidate from one stage to another"""
    try:
        candidate_id = data.get("candidate_id")
        from_stage = data.get("from_stage")
        to_stage = data.get("to_stage")
        
        # Find candidate in source stage
        source_stage = next((stage for stage in crm_pipeline["stages"] if stage["id"] == from_stage), None)
        target_stage = next((stage for stage in crm_pipeline["stages"] if stage["id"] == to_stage), None)
        
        if not source_stage or not target_stage:
            raise HTTPException(status_code=404, detail="Stage not found")
        
        # Find and move candidate
        candidate = None
        for i, c in enumerate(source_stage["candidates"]):
            if c["id"] == candidate_id:
                candidate = source_stage["candidates"].pop(i)
                break
        
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found in source stage")
        
        target_stage["candidates"].append(candidate)
        
        return {"message": f"Candidate moved from {from_stage} to {to_stage}", "candidate": candidate}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pipeline/add-candidate")
async def add_candidate_to_stage(candidate_data: Dict[str, Any]):
    """Add a new candidate to a specific stage"""
    try:
        stage_id = candidate_data.get("stage_id", "applied")
        stage = next((s for s in crm_pipeline["stages"] if s["id"] == stage_id), None)
        
        if not stage:
            raise HTTPException(status_code=404, detail="Stage not found")
        
        candidate = {
            "id": str(uuid.uuid4()),
            "name": candidate_data.get("name", ""),
            "email": candidate_data.get("email", ""),
            "phone": candidate_data.get("phone", ""),
            "position": candidate_data.get("position", ""),
            "added_date": datetime.now().isoformat(),
            "notes": candidate_data.get("notes", "")
        }
        
        stage["candidates"].append(candidate)
        return {"message": "Candidate added successfully", "candidate": candidate}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/candidate/{candidate_id}/notes")
async def get_candidate_notes_endpoint(candidate_id: str):
    """Get all notes for a specific candidate"""
    try:
        notes = candidate_notes.get(candidate_id, [])
        return {"candidate_id": candidate_id, "notes": notes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/candidate/{candidate_id}/notes")
async def add_candidate_note(candidate_id: str, note_data: Dict[str, Any]):
    """Add a note to a specific candidate"""
    try:
        note = {
            "id": str(uuid.uuid4()),
            "content": note_data.get("note", ""),
            "author": note_data.get("author", "Recruiter"),
            "created_at": datetime.now().isoformat(),
            "type": note_data.get("type", "general")
        }
        
        if candidate_id not in candidate_notes:
            candidate_notes[candidate_id] = []
        
        candidate_notes[candidate_id].append(note)
        
        # Log engagement
        engagement_history.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "action": "note_added",
            "details": f"Note added: {note['content'][:50]}...",
            "timestamp": datetime.now().isoformat(),
            "user": note["author"]
        })
        
        return {"message": "Note added successfully", "note": note}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/candidate/{candidate_id}/notes/{note_id}")
async def delete_candidate_note(candidate_id: str, note_id: str):
    """Delete a specific note from a candidate"""
    try:
        if candidate_id not in candidate_notes:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        notes = candidate_notes[candidate_id]
        note_index = next((i for i, note in enumerate(notes) if note["id"] == note_id), None)
        
        if note_index is None:
            raise HTTPException(status_code=404, detail="Note not found")
        
        deleted_note = notes.pop(note_index)
        
        # Log engagement
        engagement_history.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "action": "note_deleted",
            "details": f"Note deleted: {deleted_note['content'][:50]}...",
            "timestamp": datetime.now().isoformat(),
            "user": "System"
        })
        
        return {"message": "Note deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/candidate/{candidate_id}/tags")
async def get_candidate_tags_endpoint(candidate_id: str):
    """Get all tags for a specific candidate"""
    try:
        tags = candidate_tags.get(candidate_id, [])
        return {"candidate_id": candidate_id, "tags": tags}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/candidate/{candidate_id}/tags")
async def add_candidate_tag(candidate_id: str, tag_data: Dict[str, Any]):
    """Add a tag to a specific candidate"""
    try:
        tag = {
            "id": str(uuid.uuid4()),
            "name": tag_data.get("tag", ""),
            "color": tag_data.get("color", "#3b82f6"),
            "created_at": datetime.now().isoformat(),
            "created_by": tag_data.get("created_by", "Recruiter")
        }
        
        if candidate_id not in candidate_tags:
            candidate_tags[candidate_id] = []
        
        # Check if tag already exists
        existing_tag = next((t for t in candidate_tags[candidate_id] if t["name"].lower() == tag["name"].lower()), None)
        if existing_tag:
            raise HTTPException(status_code=400, detail="Tag already exists")
        
        candidate_tags[candidate_id].append(tag)
        
        # Log engagement
        engagement_history.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "action": "tag_added",
            "details": f"Tag added: {tag['name']}",
            "timestamp": datetime.now().isoformat(),
            "user": tag["created_by"]
        })
        
        return {"message": "Tag added successfully", "tag": tag}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/candidate/{candidate_id}/tags/{tag_id}")
async def delete_candidate_tag(candidate_id: str, tag_id: str):
    """Delete a specific tag from a candidate"""
    try:
        if candidate_id not in candidate_tags:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        tags = candidate_tags[candidate_id]
        tag_index = next((i for i, tag in enumerate(tags) if tag["id"] == tag_id), None)
        
        if tag_index is None:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        deleted_tag = tags.pop(tag_index)
        
        # Log engagement
        engagement_history.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "action": "tag_deleted",
            "details": f"Tag deleted: {deleted_tag['name']}",
            "timestamp": datetime.now().isoformat(),
            "user": "System"
        })
        
        return {"message": "Tag deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/candidate/{candidate_id}/engagement")
async def get_candidate_engagement_history(candidate_id: str):
    """Get engagement history for a specific candidate"""
    try:
        candidate_engagement = [e for e in engagement_history if e["candidate_id"] == candidate_id]
        return {"candidate_id": candidate_id, "engagement_history": candidate_engagement}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

