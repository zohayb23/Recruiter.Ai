from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import uvicorn
import os
import json
import csv
import io
from datetime import datetime
from typing import List, Dict, Any
import zipfile
import tempfile

app = FastAPI(title="Recruiter.AI Data Management", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (this would normally come from your main backend)
stored_resumes = []
stored_job_descriptions = []

@app.get("/")
async def root():
    return {
        "message": "Recruiter.AI Data Management Backend",
        "status": "healthy",
        "features": [
            "Export resumes to CSV/JSON",
            "Export job descriptions to CSV/JSON",
            "Import data from CSV/JSON",
            "Backup and restore functionality",
            "Data validation and cleaning"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "data-management-backend"}

# Export Endpoints
@app.get("/api/export/resumes/csv")
async def export_resumes_csv():
    """Export all resumes to CSV format"""
    try:
        if not stored_resumes:
            raise HTTPException(status_code=404, detail="No resumes found to export")
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Resume ID', 'Full Name', 'Email', 'Phone', 'LinkedIn', 'GitHub', 'Website',
            'Summary', 'Skills', 'Education', 'Work Experience', 'Certifications',
            'Languages', 'File Path', 'Created At'
        ])
        
        # Write data
        for resume in stored_resumes:
            writer.writerow([
                resume.get('resume_id', ''),
                resume.get('full_name', ''),
                resume.get('contact', {}).get('email', ''),
                resume.get('contact', {}).get('phone', ''),
                resume.get('contact', {}).get('linkedin', ''),
                resume.get('contact', {}).get('github', ''),
                resume.get('contact', {}).get('website', ''),
                resume.get('summary', ''),
                json.dumps(resume.get('skills', [])),
                json.dumps(resume.get('education', [])),
                json.dumps(resume.get('work_experience', [])),
                json.dumps(resume.get('certifications', [])),
                json.dumps(resume.get('languages', [])),
                resume.get('file_path', ''),
                resume.get('created_at', '')
            ])
        
        # Create response
        output.seek(0)
        csv_content = output.getvalue()
        output.close()
        
        # Create file response
        filename = f"resumes_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export resumes: {str(e)}")

@app.get("/api/export/jobs/csv")
async def export_jobs_csv():
    """Export all job descriptions to CSV format"""
    try:
        if not stored_job_descriptions:
            raise HTTPException(status_code=404, detail="No job descriptions found to export")
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Job ID', 'Title', 'Company', 'Department', 'Location Type', 'Location',
            'Experience Level', 'Overview', 'Responsibilities', 'Qualifications',
            'Required Skills', 'Preferred Skills', 'Benefits', 'Company Description',
            'Status', 'Created At', 'Updated At'
        ])
        
        # Write data
        for job in stored_job_descriptions:
            writer.writerow([
                job.get('job_id', ''),
                job.get('title', ''),
                job.get('company', ''),
                job.get('department', ''),
                job.get('location_type', ''),
                job.get('location', ''),
                job.get('experience_level', ''),
                job.get('overview', ''),
                json.dumps(job.get('responsibilities', [])),
                json.dumps(job.get('qualifications', [])),
                json.dumps(job.get('required_skills', [])),
                json.dumps(job.get('preferred_skills', [])),
                json.dumps(job.get('benefits', [])),
                job.get('company_description', ''),
                job.get('status', ''),
                job.get('created_at', ''),
                job.get('updated_at', '')
            ])
        
        # Create response
        output.seek(0)
        csv_content = output.getvalue()
        output.close()
        
        # Create file response
        filename = f"jobs_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export jobs: {str(e)}")

@app.get("/api/export/all/json")
async def export_all_json():
    """Export all data to JSON format"""
    try:
        export_data = {
            "export_info": {
                "exported_at": datetime.now().isoformat(),
                "total_resumes": len(stored_resumes),
                "total_jobs": len(stored_job_descriptions),
                "version": "1.0.0"
            },
            "resumes": stored_resumes,
            "job_descriptions": stored_job_descriptions
        }
        
        # Create file response
        filename = f"recruiter_ai_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        return StreamingResponse(
            io.BytesIO(json.dumps(export_data, indent=2).encode('utf-8')),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export data: {str(e)}")

@app.get("/api/export/all/zip")
async def export_all_zip():
    """Export all data as a ZIP file with separate CSV files"""
    try:
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Create CSV files
            resumes_file = os.path.join(temp_dir, f"resumes_{timestamp}.csv")
            jobs_file = os.path.join(temp_dir, f"jobs_{timestamp}.csv")
            metadata_file = os.path.join(temp_dir, f"metadata_{timestamp}.json")
            
            # Write resumes CSV
            with open(resumes_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'Resume ID', 'Full Name', 'Email', 'Phone', 'LinkedIn', 'GitHub', 'Website',
                    'Summary', 'Skills', 'Education', 'Work Experience', 'Certifications',
                    'Languages', 'File Path', 'Created At'
                ])
                
                for resume in stored_resumes:
                    writer.writerow([
                        resume.get('resume_id', ''),
                        resume.get('full_name', ''),
                        resume.get('contact', {}).get('email', ''),
                        resume.get('contact', {}).get('phone', ''),
                        resume.get('contact', {}).get('linkedin', ''),
                        resume.get('contact', {}).get('github', ''),
                        resume.get('contact', {}).get('website', ''),
                        resume.get('summary', ''),
                        json.dumps(resume.get('skills', [])),
                        json.dumps(resume.get('education', [])),
                        json.dumps(resume.get('work_experience', [])),
                        json.dumps(resume.get('certifications', [])),
                        json.dumps(resume.get('languages', [])),
                        resume.get('file_path', ''),
                        resume.get('created_at', '')
                    ])
            
            # Write jobs CSV
            with open(jobs_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'Job ID', 'Title', 'Company', 'Department', 'Location Type', 'Location',
                    'Experience Level', 'Overview', 'Responsibilities', 'Qualifications',
                    'Required Skills', 'Preferred Skills', 'Benefits', 'Company Description',
                    'Status', 'Created At', 'Updated At'
                ])
                
                for job in stored_job_descriptions:
                    writer.writerow([
                        job.get('job_id', ''),
                        job.get('title', ''),
                        job.get('company', ''),
                        job.get('department', ''),
                        job.get('location_type', ''),
                        job.get('location', ''),
                        job.get('experience_level', ''),
                        job.get('overview', ''),
                        json.dumps(job.get('responsibilities', [])),
                        json.dumps(job.get('qualifications', [])),
                        json.dumps(job.get('required_skills', [])),
                        json.dumps(job.get('preferred_skills', [])),
                        json.dumps(job.get('benefits', [])),
                        job.get('company_description', ''),
                        job.get('status', ''),
                        job.get('created_at', ''),
                        job.get('updated_at', '')
                    ])
            
            # Write metadata
            metadata = {
                "export_info": {
                    "exported_at": datetime.now().isoformat(),
                    "total_resumes": len(stored_resumes),
                    "total_jobs": len(stored_job_descriptions),
                    "version": "1.0.0"
                }
            }
            
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2)
            
            # Create ZIP file
            zip_filename = f"recruiter_ai_backup_{timestamp}.zip"
            zip_path = os.path.join(temp_dir, zip_filename)
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                zipf.write(resumes_file, f"resumes_{timestamp}.csv")
                zipf.write(jobs_file, f"jobs_{timestamp}.csv")
                zipf.write(metadata_file, f"metadata_{timestamp}.json")
            
            # Return ZIP file
            return FileResponse(
                zip_path,
                media_type="application/zip",
                filename=zip_filename
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create ZIP export: {str(e)}")

# Import Endpoints
@app.post("/api/import/resumes/csv")
async def import_resumes_csv(file: UploadFile = File(...)):
    """Import resumes from CSV file"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV file")
        
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        imported_count = 0
        
        for row in csv_reader:
            try:
                resume_data = {
                    "resume_id": row.get('Resume ID', ''),
                    "full_name": row.get('Full Name', ''),
                    "contact": {
                        "email": row.get('Email', ''),
                        "phone": row.get('Phone', ''),
                        "linkedin": row.get('LinkedIn', ''),
                        "github": row.get('GitHub', ''),
                        "website": row.get('Website', '')
                    },
                    "summary": row.get('Summary', ''),
                    "skills": json.loads(row.get('Skills', '[]')),
                    "education": json.loads(row.get('Education', '[]')),
                    "work_experience": json.loads(row.get('Work Experience', '[]')),
                    "certifications": json.loads(row.get('Certifications', '[]')),
                    "languages": json.loads(row.get('Languages', '[]')),
                    "file_path": row.get('File Path', ''),
                    "created_at": row.get('Created At', datetime.now().isoformat())
                }
                
                stored_resumes.append(resume_data)
                imported_count += 1
                
            except Exception as e:
                print(f"Error importing resume row: {e}")
                continue
        
        return {
            "success": True,
            "message": f"Successfully imported {imported_count} resumes",
            "imported_count": imported_count,
            "total_resumes": len(stored_resumes)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import resumes: {str(e)}")

@app.post("/api/import/jobs/csv")
async def import_jobs_csv(file: UploadFile = File(...)):
    """Import job descriptions from CSV file"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV file")
        
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        imported_count = 0
        
        for row in csv_reader:
            try:
                job_data = {
                    "job_id": row.get('Job ID', ''),
                    "title": row.get('Title', ''),
                    "company": row.get('Company', ''),
                    "department": row.get('Department', ''),
                    "location_type": row.get('Location Type', ''),
                    "location": row.get('Location', ''),
                    "experience_level": row.get('Experience Level', ''),
                    "overview": row.get('Overview', ''),
                    "responsibilities": json.loads(row.get('Responsibilities', '[]')),
                    "qualifications": json.loads(row.get('Qualifications', '[]')),
                    "required_skills": json.loads(row.get('Required Skills', '[]')),
                    "preferred_skills": json.loads(row.get('Preferred Skills', '[]')),
                    "benefits": json.loads(row.get('Benefits', '[]')),
                    "company_description": row.get('Company Description', ''),
                    "status": row.get('Status', 'published'),
                    "created_at": row.get('Created At', datetime.now().isoformat()),
                    "updated_at": row.get('Updated At', datetime.now().isoformat())
                }
                
                stored_job_descriptions.append(job_data)
                imported_count += 1
                
            except Exception as e:
                print(f"Error importing job row: {e}")
                continue
        
        return {
            "success": True,
            "message": f"Successfully imported {imported_count} job descriptions",
            "imported_count": imported_count,
            "total_jobs": len(stored_job_descriptions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import jobs: {str(e)}")

# Data Statistics
@app.get("/api/stats")
async def get_data_statistics():
    """Get statistics about stored data"""
    try:
        stats = {
            "total_resumes": len(stored_resumes),
            "total_jobs": len(stored_job_descriptions),
            "resume_stats": {
                "with_email": len([r for r in stored_resumes if r.get('contact', {}).get('email')]),
                "with_phone": len([r for r in stored_resumes if r.get('contact', {}).get('phone')]),
                "with_skills": len([r for r in stored_resumes if r.get('skills')]),
                "with_education": len([r for r in stored_resumes if r.get('education')]),
                "with_experience": len([r for r in stored_resumes if r.get('work_experience')])
            },
            "job_stats": {
                "published": len([j for j in stored_job_descriptions if j.get('status') == 'published']),
                "draft": len([j for j in stored_job_descriptions if j.get('status') == 'draft']),
                "remote": len([j for j in stored_job_descriptions if j.get('location_type') == 'remote']),
                "onsite": len([j for j in stored_job_descriptions if j.get('location_type') == 'onsite']),
                "hybrid": len([j for j in stored_job_descriptions if j.get('location_type') == 'hybrid'])
            },
            "last_updated": datetime.now().isoformat()
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8805)
