import pdfplumber
from docx import Document
import re
import logging
from typing import Optional
from pathlib import Path
import subprocess
import tempfile
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Handles the extraction of text from different document formats"""
    
    @staticmethod
    def extract_from_rtf(file_path: str) -> Optional[str]:
        """Extract text from RTF files using textutil (macOS) or unrtf (Linux)"""
        try:
            logger.info(f"Extracting text from RTF: {file_path}")
            
            # Create a temporary file for the output
            with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp_file:
                temp_path = temp_file.name
            
            try:
                # Try textutil (macOS)
                subprocess.run(['textutil', '-convert', 'txt', '-output', temp_path, file_path], check=True)
            except (subprocess.CalledProcessError, FileNotFoundError):
                try:
                    # Try unrtf (Linux)
                    result = subprocess.run(['unrtf', '--text', file_path], capture_output=True, text=True, check=True)
                    with open(temp_path, 'w') as f:
                        f.write(result.stdout)
                except (subprocess.CalledProcessError, FileNotFoundError):
                    logger.error("Neither textutil nor unrtf is available")
                    raise Exception("RTF conversion tools not available")
            
            # Read the converted text
            with open(temp_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            # Clean up
            os.unlink(temp_path)
            
            if not text.strip():
                logger.warning("No text extracted from RTF file")
                return None
            
            logger.info("Successfully extracted text from RTF")
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text from RTF: {str(e)}", exc_info=True)
            raise Exception(f"Error extracting text from RTF: {str(e)}")

    @staticmethod
    def extract_from_pdf(file_path: str) -> Optional[str]:
        """Extract text from PDF files using pdfplumber"""
        try:
            logger.info(f"Extracting text from PDF: {file_path}")
            text_content = []
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    logger.info(f"Processing page {page_num} of {len(pdf.pages)}")
                    text = page.extract_text()
                    if text:
                        text_content.append(text)
                    else:
                        logger.warning(f"No text extracted from page {page_num}")
            
            if not text_content:
                logger.warning("No text extracted from any page of the PDF")
                return None
                
            logger.info(f"Successfully extracted text from PDF, {len(text_content)} pages")
            return '\n'.join(text_content)
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}", exc_info=True)
            raise Exception(f"Error extracting text from PDF: {str(e)}")

    @staticmethod
    def extract_from_docx(file_path: str) -> Optional[str]:
        """Extract text from DOCX files using python-docx"""
        try:
            logger.info(f"Extracting text from DOCX: {file_path}")
            doc = Document(file_path)
            text_content = []
            
            # Extract text from paragraphs
            logger.info("Processing paragraphs...")
            for para_num, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    text_content.append(paragraph.text)
                    
            # Extract text from tables
            logger.info("Processing tables...")
            for table_num, table in enumerate(doc.tables, 1):
                logger.info(f"Processing table {table_num}")
                for row in table.rows:
                    row_text = []
                    for cell in row.cells:
                        if cell.text.strip():
                            row_text.append(cell.text.strip())
                    if row_text:
                        text_content.append(' | '.join(row_text))
            
            if not text_content:
                logger.warning("No text extracted from DOCX file")
                return None
                
            logger.info(f"Successfully extracted text from DOCX")
            return '\n'.join(text_content)
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {str(e)}", exc_info=True)
            raise Exception(f"Error extracting text from DOCX: {str(e)}")

    @staticmethod
    def extract_from_text(file_path: str) -> Optional[str]:
        """Extract text from plain text files"""
        try:
            logger.info(f"Reading text file: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
                if not text.strip():
                    logger.warning("Text file is empty")
                    return None
                logger.info("Successfully read text file")
                return text
        except UnicodeDecodeError:
            # Try different encodings
            encodings = ['latin-1', 'cp1252', 'iso-8859-1']
            for encoding in encodings:
                try:
                    logger.info(f"Trying encoding: {encoding}")
                    with open(file_path, 'r', encoding=encoding) as file:
                        text = file.read()
                        if text.strip():
                            logger.info(f"Successfully read text file with {encoding} encoding")
                            return text
                except Exception:
                    continue
            logger.error("Failed to read text file with any encoding")
            raise Exception("Unable to read text file with any supported encoding")
        except Exception as e:
            logger.error(f"Error extracting text from text file: {str(e)}", exc_info=True)
            raise Exception(f"Error extracting text from text file: {str(e)}")

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        logger.info("Cleaning extracted text...")
        
        # Replace unicode quotes with standard quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        # Replace multiple newlines with a single newline
        text = re.sub(r'\n\s*\n', '\n', text)
        
        # Replace multiple spaces with a single space
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.,;:\'\"!?@\-\(\)]', ' ', text)
        
        # Fix common OCR errors
        text = text.replace('|', 'I')  # Common OCR error for capital I
        text = re.sub(r'(\d)l', r'\1l', text)  # Fix "1l" to "11" if it's likely a number
        
        # Remove extra whitespace
        text = text.strip()
        
        logger.info("Text cleaning completed")
        return text

    def process_document(self, file_path: str) -> str:
        """Process document based on file extension"""
        try:
            file_path = Path(file_path)
            logger.info(f"Processing document: {file_path}")
            
            if not file_path.exists():
                logger.error(f"File not found: {file_path}")
                raise FileNotFoundError(f"File not found: {file_path}")
            
            if not file_path.is_file():
                logger.error(f"Not a file: {file_path}")
                raise ValueError(f"Not a file: {file_path}")
            
            # Get file extension and convert to lowercase
            extension = file_path.suffix.lower()
            logger.info(f"File extension: {extension}")
            
            # Extract text based on file type
            if extension == '.pdf':
                text = self.extract_from_pdf(str(file_path))
            elif extension in ['.docx', '.doc']:
                text = self.extract_from_docx(str(file_path))
            elif extension == '.txt':
                text = self.extract_from_text(str(file_path))
            elif extension == '.rtf':
                text = self.extract_from_rtf(str(file_path))
            else:
                logger.error(f"Unsupported file format: {extension}")
                raise ValueError(f"Unsupported file format: {extension}")
            
            if not text:
                logger.warning("No text extracted from document")
                return ""
            
            # Clean and normalize the text
            cleaned_text = self.clean_text(text)
            logger.info(f"Processed text length: {len(cleaned_text)} characters")
            
            return cleaned_text
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}", exc_info=True)
            raise 