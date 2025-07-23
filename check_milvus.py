from pymilvus import connections, utility, Collection
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_milvus():
    try:
        # Connect to Milvus
        connections.connect(host='localhost', port='19530')
        logger.info("Successfully connected to Milvus")
        
        # List collections
        collections = utility.list_collections()
        logger.info(f"Available collections: {collections}")
        
        # Check resumes collection
        if "resumes" in collections:
            collection = Collection("resumes")
            logger.info(f"Collection schema: {collection.schema}")
            logger.info(f"Number of entities: {collection.num_entities}")
            
            # Try a query
            collection.load()
            results = collection.query(
                expr="resume_id != ''",
                output_fields=["resume_id", "full_name"],
                limit=10
            )
            logger.info(f"Query results: {results}")
        else:
            logger.warning("Resumes collection does not exist")
            
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
    finally:
        connections.disconnect('default')

if __name__ == "__main__":
    check_milvus() 