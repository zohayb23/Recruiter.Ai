"""
Milvus Routes - Handle all Milvus collection and management endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pymilvus import connections, Collection, utility

from ..services.milvus_service import MILVUS_HOST, MILVUS_PORT, milvus_connected
from ..config.settings import settings

router = APIRouter(prefix="/api/milvus", tags=["Milvus"])

@router.get("/test-connection")
async def test_milvus_connection_endpoint():
    """Test Milvus connection"""
    try:
        from ..services.milvus_service import test_milvus_connection
        connected = test_milvus_connection()
        return {
            "milvus_connected": connected,
            "host": MILVUS_HOST,
            "port": MILVUS_PORT,
            "message": "Milvus connection successful" if connected else "Milvus connection failed"
        }
    except Exception as e:
        return {
            "milvus_connected": False,
            "host": MILVUS_HOST,
            "port": MILVUS_PORT,
            "error": str(e),
            "message": "Milvus connection failed"
        }

@router.get("/collections")
async def get_collections():
    """Get all Milvus collections"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        collections = []
        for collection_name in ["resumes", "job_descriptions", "interview_results", "job_categories"]:
            if utility.has_collection(collection_name):
                collection = Collection(collection_name)
                collection.load()
                
                # Get entity count
                entity_count = collection.num_entities
                
                # Get field information
                fields = []
                for field in collection.schema.fields:
                    fields.append({
                        "name": field.name,
                        "type": str(field.dtype),
                        "description": f"Field of type {field.dtype}"
                    })
                
                collections.append({
                    "name": collection_name,
                    "description": f"Collection for {collection_name.replace('_', ' ')}",
                    "entityCount": entity_count,
                    "fields": fields
                })
        
        return collections
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching collections: {str(e)}")

@router.get("/collections/{collection_name}/stats")
async def get_collection_stats(collection_name: str):
    """Get collection statistics"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection(collection_name):
            raise HTTPException(status_code=404, detail="Collection not found")
        
        collection = Collection(collection_name)
        collection.load()
        
        stats = {
            "name": collection_name,
            "entity_count": collection.num_entities,
            "indexes": len(collection.indexes),
            "partitions": len(collection.partitions),
            "schema": {
                "fields": [
                    {
                        "name": field.name,
                        "type": str(field.dtype),
                        "is_primary": field.is_primary,
                        "auto_id": field.auto_id
                    }
                    for field in collection.schema.fields
                ]
            }
        }
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching collection stats: {str(e)}")

@router.post("/collections/{collection_name}/insert")
async def insert_data(collection_name: str, data: Dict[str, Any]):
    """Insert data into collection"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection(collection_name):
            raise HTTPException(status_code=404, detail="Collection not found")
        
        collection = Collection(collection_name)
        collection.load()
        
        # This is a placeholder - actual implementation would depend on collection schema
        return {"message": f"Data insertion for {collection_name} not implemented yet"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inserting data: {str(e)}")

@router.delete("/collections/{collection_name}/delete")
async def delete_data(collection_name: str, data: Dict[str, Any]):
    """Delete data from collection"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection(collection_name):
            raise HTTPException(status_code=404, detail="Collection not found")
        
        collection = Collection(collection_name)
        collection.load()
        
        # This is a placeholder - actual implementation would depend on collection schema
        return {"message": f"Data deletion for {collection_name} not implemented yet"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting data: {str(e)}")

@router.post("/reconnect")
async def reconnect_milvus():
    """Manually reconnect to Milvus"""
    from ..services.milvus_service import test_milvus_connection
    if test_milvus_connection():
        return {"status": "success", "message": "Successfully reconnected to Milvus", "milvus_connected": milvus_connected}
    else:
        return {"status": "error", "message": "Failed to reconnect to Milvus", "milvus_connected": milvus_connected}

@router.get("/status")
async def get_milvus_status():
    """Check Milvus connection status and collection info"""
    try:
        status = {
            "milvus_connected": milvus_connected,
            "milvus_host": MILVUS_HOST,
            "milvus_port": MILVUS_PORT,
            "collections": {},
            "error": None
        }
        
        if milvus_connected:
            try:
                # Test connection
                connections.disconnect("default")
                connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
                
                # Check collections
                collection_names = ["resumes", "job_descriptions", "interview_results", "job_categories"]
                for name in collection_names:
                    if utility.has_collection(name):
                        collection = Collection(name)
                        collection.load()
                        status["collections"][name] = {
                            "exists": True,
                            "entity_count": collection.num_entities
                        }
                    else:
                        status["collections"][name] = {
                            "exists": False,
                            "entity_count": 0
                        }
                        
            except Exception as e:
                status["error"] = str(e)
                status["milvus_connected"] = False
        else:
            status["error"] = "Milvus not connected"
            
        return status
        
    except Exception as e:
        return {
            "milvus_connected": False,
            "error": str(e),
            "collections": {}
        }

@router.post("/reset-resumes-collection")
async def reset_resumes_collection():
    """Reset the resumes collection"""
    try:
        from ..services.milvus_service import recreate_resumes_collection
        result = recreate_resumes_collection()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting collection: {str(e)}")

@router.post("/reset-all-collections")
async def reset_all_collections():
    """Reset all collections"""
    try:
        from ..services.milvus_service import (
            recreate_resumes_collection,
            recreate_job_descriptions_collection
        )
        results = {
            "resumes": recreate_resumes_collection(),
            "job_descriptions": recreate_job_descriptions_collection()
        }
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting collections: {str(e)}")

@router.get("/collection-schema")
async def get_collection_schema():
    """Get schema for all collections"""
    try:
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        schemas = {}
        collection_names = ["resumes", "job_descriptions", "interview_results", "job_categories"]
        
        for name in collection_names:
            if utility.has_collection(name):
                collection = Collection(name)
                schemas[name] = {
                    "fields": [
                        {
                            "name": field.name,
                            "type": str(field.dtype),
                            "is_primary": field.is_primary,
                            "max_length": getattr(field, 'max_length', None)
                        }
                        for field in collection.schema.fields
                    ]
                }
        
        return schemas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching schemas: {str(e)}")

