import os
import logging
from typing import Optional
from pathlib import Path
from datetime import datetime
import re
from fastapi import UploadFile, HTTPException
from .document_processor import DocumentProcessor
from .entity_extractor import EntityExtractor
from ...models.resume import ParsedResume, ResumeParseResponse
from ..vector_store.milvus_service import milvus_service
from ..vector_store.milvus_loadbalancer_service import milvus_loadbalancer_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeParserService:
    """Main service for parsing resumes"""
    
    def __init__(self):
        self.document_processor = DocumentProcessor()
        self.entity_extractor = EntityExtractor()
        
        # Ensure the upload directory exists
        self.upload_dir = Path("uploads/resumes")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Resume upload directory: {self.upload_dir}")

    def sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to be compatible with all operating systems.
        
        Args:
            filename: Original filename
            
        Returns:
            Sanitized filename
        """
        # Get the file extension
        name, ext = os.path.splitext(filename)
        
        # Replace problematic characters with safe alternatives
        # Replace colons with dashes
        name = name.replace(':', '-')
        # Replace other unsafe characters
        name = re.sub(r'[<>:"/\\|?*]', '-', name)
        # Remove control characters
        name = "".join(char for char in name if ord(char) >= 32)
        # Trim spaces and dots from ends
        name = name.strip('. ')
        
        # Ensure the filename isn't too long (max 255 chars including extension)
        max_length = 255 - len(ext)
        if len(name) > max_length:
            name = name[:max_length]
            
        return f"{name}{ext}"

    async def parse_resume(self, file: UploadFile) -> ResumeParseResponse:
        """
        Parse a resume file and extract structured information
        
        Args:
            file: UploadFile from FastAPI
            
        Returns:
            ResumeParseResponse containing the parsed information or error details
        """
        try:
            # Validate file
            if not file.filename:
                raise HTTPException(status_code=400, detail="No file provided")
            
            # Check file size (10MB limit)
            content = await file.read()
            if len(content) > 10 * 1024 * 1024:  # 10MB
                raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
            
            # Check file extension
            allowed_extensions = {'.pdf', '.doc', '.docx', '.txt', '.rtf'}  # Added .rtf
            file_ext = Path(file.filename).suffix.lower()
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format. Allowed formats: {', '.join(allowed_extensions)}"
                )
            
            logger.info(f"Starting to parse resume: {file.filename} (size: {len(content)} bytes)")
            
            # Save file
            file_path = await self.save_resume_file(content, file.filename)
            logger.info(f"Saved resume to: {file_path}")
            
            try:
                # Extract text from document
                logger.info("Extracting text from document...")
                text = self.document_processor.process_document(file_path)
                
                if not text:
                    logger.warning("No text could be extracted from the document")
                    raise HTTPException(
                        status_code=400,
                        detail="No text could be extracted from the document"
                    )
                
                logger.info(f"Successfully extracted text, length: {len(text)}")
                
                # Extract information from text
                logger.info("Extracting information from text...")
                parsed_resume = self.entity_extractor.extract_all(text)
                
                if not parsed_resume:
                    logger.warning("No information could be extracted from the text")
                    raise HTTPException(
                        status_code=400,
                        detail="No information could be extracted from the text"
                    )
                
                # Add additional metadata
                parsed_resume.resume_id = f"res_{str(abs(hash(text)))[:3].zfill(3)}"  # Generate a unique ID in format res_001
                parsed_resume.file_path = str(file_path)
                parsed_resume.created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                parsed_resume.raw_text = text
                
                logger.info(f"Parsed resume data: {parsed_resume.dict()}")
                
                # Store in both Milvus instances
                logger.info("Attempting to store resume in Milvus instances")
                try:
                    # Store in primary Milvus
                    store_success_primary = milvus_service.insert_resume(parsed_resume.dict())
                    if not store_success_primary:
                        logger.warning("Failed to store resume in primary Milvus")
                    else:
                        logger.info("Successfully stored resume in primary Milvus")

                    # Store in loadbalancer Milvus
                    store_success_lb = milvus_loadbalancer_service.insert_resume(parsed_resume.dict())
                    if not store_success_lb:
                        logger.warning("Failed to store resume in loadbalancer Milvus")
                    else:
                        logger.info("Successfully stored resume in loadbalancer Milvus")

                except Exception as e:
                    logger.warning(f"Failed to store resume in one or both Milvus instances: {e}")
                
                logger.info("Successfully parsed and stored resume")
                return ResumeParseResponse(
                    success=True,
                    data=parsed_resume,
                    message="Resume parsed successfully"
                )
                
            finally:
                # Clean up the temporary file
                logger.info(f"Cleaning up file: {file_path}")
                self.cleanup_file(file_path)
                logger.info("File cleanup successful")
                
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error parsing resume: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error parsing resume: {str(e)}"
            )

    async def save_resume_file(self, file_content: bytes, filename: str) -> str:
        """Save uploaded file to disk with a unique name"""
        try:
            # Sanitize the filename
            sanitized_name = self.sanitize_filename(filename)
            base_name = Path(sanitized_name).stem
            extension = Path(sanitized_name).suffix
            counter = 1
            
            while True:
                unique_name = f"{base_name}{'_' + str(counter) if counter > 1 else ''}{extension}"
                file_path = self.upload_dir / unique_name
                if not file_path.exists():
                    break
                counter += 1

            # Save file
            logger.info(f"Saving resume file: {filename} as {unique_name}")
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            logger.info(f"Successfully saved file to: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error saving file: {str(e)}"
            )

    def cleanup_file(self, file_path: str) -> None:
        """Clean up temporary files"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.error(f"Error cleaning up file {file_path}: {str(e)}")
            # Don't raise an exception here as this is cleanup code

resume_parser_service = ResumeParserService() 