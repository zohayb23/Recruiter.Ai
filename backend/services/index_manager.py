import os
import logging
from whoosh.index import create_in, open_dir, exists_in
from whoosh.fields import Schema, TEXT, ID, KEYWORD, STORED
from whoosh.analysis import StemmingAnalyzer
import docx
import PyPDF2

logger = logging.getLogger(__name__)

def get_index_dir():
    """Get the directory where the search index is stored."""
    parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    index_dir = os.path.join(parent_dir, "search_index")
    os.makedirs(index_dir, exist_ok=True)
    return index_dir

def get_schema():
    """Define the schema for the search index."""
    return Schema(
        filename=ID(stored=True),
        name=TEXT(stored=True),
        content=TEXT(analyzer=StemmingAnalyzer(), stored=True),
        summary=TEXT(stored=True),
        experience=TEXT(stored=True),
        skills=KEYWORD(stored=True, commas=True),
        location=TEXT(stored=True),
        email=ID(stored=True),
        phone=ID(stored=True)
    )

def get_index():
    """Get or create the search index."""
    index_dir = get_index_dir()
    
    if not exists_in(index_dir):
        logger.info("Creating new search index...")
        os.makedirs(index_dir, exist_ok=True)
        return create_in(index_dir, get_schema())
    
    try:
        return open_dir(index_dir)
    except Exception as e:
        logger.error(f"Error opening index: {str(e)}")
        return None

def index_resume(filename: str, file_path: str, ix=None):
    """Index a single resume file."""
    if ix is None:
        ix = get_index()
    
    if not ix:
        logger.error("Failed to get index")
        return False
    
    try:
        # Extract content based on file type
        content = ""
        if filename.lower().endswith('.docx'):
            doc = docx.Document(file_path)
            content = " ".join([para.text for para in doc.paragraphs])
        elif filename.lower().endswith('.pdf'):
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                content = " ".join([page.extract_text() for page in pdf_reader.pages])
        else:
            logger.warning(f"Unsupported file type: {filename}")
            return False
        
        if not content.strip():
            logger.warning(f"No content extracted from {filename}")
            return False
        
        # Extract basic information
        name = os.path.splitext(filename)[0]
        
        # Index the document
        writer = ix.writer()
        writer.add_document(
            filename=filename,
            name=name,
            content=content,
            summary="",  # Will be generated during search
            experience="",  # Will be extracted during search
            skills="",  # Will be extracted during search
            location="",  # Will be extracted during search
            email="",  # Will be extracted during search
            phone=""  # Will be extracted during search
        )
        writer.commit()
        
        logger.info(f"Successfully indexed {filename}")
        return True
        
    except Exception as e:
        logger.error(f"Error indexing {filename}: {str(e)}")
        return False

def rebuild_index():
    """Rebuild the entire search index from resume files."""
    try:
        # Get paths
        parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        pdf_dir = os.path.join(parent_dir, "pdf_resumes")
        docx_dir = os.path.join(parent_dir, "docx_resumes")
        
        # Create new index
        index_dir = get_index_dir()
        if exists_in(index_dir):
            import shutil
            shutil.rmtree(index_dir)
        
        os.makedirs(index_dir, exist_ok=True)
        ix = create_in(index_dir, get_schema())
        
        # Index PDF files
        if os.path.exists(pdf_dir):
            for filename in os.listdir(pdf_dir):
                if filename.lower().endswith('.pdf'):
                    file_path = os.path.join(pdf_dir, filename)
                    index_resume(filename, file_path, ix)
        
        # Index DOCX files
        if os.path.exists(docx_dir):
            for filename in os.listdir(docx_dir):
                if filename.lower().endswith('.docx'):
                    file_path = os.path.join(docx_dir, filename)
                    index_resume(filename, file_path, ix)
        
        logger.info("Index rebuild complete")
        return True
        
    except Exception as e:
        logger.error(f"Error rebuilding index: {str(e)}")
        return False 