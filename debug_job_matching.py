#!/usr/bin/env python3

import asyncio
import json
from pymilvus import Collection, connections

# Connect to Milvus
connections.connect("default", host="34.135.232.156", port="19530")

async def test_job_matching():
    """Test job matching for different candidates"""
    
    # Get a few different candidates from the resumes collection
    collection = Collection("resumes")
    collection.load()
    
    # Get 3 different candidates
    candidates = collection.query(
        expr="id != ''",
        output_fields=["id", "full_name", "skills", "work_experience", "summary"],
        limit=3
    )
    
    print(f"Found {len(candidates)} candidates to test")
    
    for i, candidate in enumerate(candidates):
        print(f"\n{'='*60}")
        print(f"CANDIDATE {i+1}: {candidate.get('full_name', 'Unknown')}")
        print(f"{'='*60}")
        
        # Parse skills
        skills = candidate.get('skills', [])
        if isinstance(skills, str):
            try:
                skills = json.loads(skills)
            except:
                skills = []
        
        print(f"Skills: {skills[:5]}..." if skills else "No skills")
        # Calculate experience from work_experience
        work_exp = candidate.get('work_experience', [])
        if isinstance(work_exp, str):
            try:
                work_exp = json.loads(work_exp)
            except:
                work_exp = []
        
        experience_years = 0
        if work_exp:
            # Simple calculation - count years from start dates
            for exp in work_exp:
                start_date = exp.get('start_date', '')
                if start_date and any(year in start_date for year in ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']):
                    # Extract year and calculate years
                    for year in ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']:
                        if year in start_date:
                            experience_years = max(experience_years, 2024 - int(year))
                            break
        
        print(f"Experience: {experience_years} years")
        print(f"Summary: {candidate.get('summary', '')[:100]}...")
        
        # Test job matching
        await test_candidate_job_matching(candidate)

async def test_candidate_job_matching(candidate_data):
    """Test job matching for a specific candidate"""
    
    # Get all job descriptions
    job_collection = Collection("job_descriptions")
    job_collection.load()
    
    jobs = job_collection.query(
        expr="id != ''",
        output_fields=["*"],
        limit=50
    )
    
    print(f"\nAvailable jobs ({len(jobs)}):")
    for job in jobs:
        print(f"  - {job.get('title', 'Unknown')} at {job.get('company', 'Unknown')}")
    
    # Simulate the matching logic
    candidate_skills = candidate_data.get('skills', [])
    if isinstance(candidate_skills, str):
        try:
            candidate_skills = json.loads(candidate_skills)
        except:
            candidate_skills = []
    
    # Calculate experience from work_experience
    work_exp = candidate_data.get('work_experience', [])
    if isinstance(work_exp, str):
        try:
            work_exp = json.loads(work_exp)
        except:
            work_exp = []
    
    candidate_experience = 0
    if work_exp:
        # Simple calculation - count years from start dates
        for exp in work_exp:
            start_date = exp.get('start_date', '')
            if start_date and any(year in start_date for year in ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']):
                # Extract year and calculate years
                for year in ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']:
                    if year in start_date:
                        candidate_experience = max(candidate_experience, 2024 - int(year))
                        break
    candidate_title = candidate_data.get('title', '').lower()
    
    print(f"\nMatching for: {candidate_data.get('full_name', 'Unknown')}")
    print(f"Skills: {candidate_skills}")
    print(f"Experience: {candidate_experience} years")
    
    best_match = None
    best_score = 0
    
    for job in jobs:
        score = 0
        match_reasons = []
        
        # 1. Experience matching
        job_experience_level = job.get('experience_level', '').lower()
        if 'entry' in job_experience_level and candidate_experience <= 2:
            score += 0.4
            match_reasons.append("experience_match_entry")
        elif 'mid' in job_experience_level and 2 < candidate_experience <= 5:
            score += 0.4
            match_reasons.append("experience_match_mid")
        elif 'senior' in job_experience_level and candidate_experience > 5:
            score += 0.4
            match_reasons.append("experience_match_senior")
        
        # 2. Skill matching
        job_required_skills = job.get('required_skills', [])
        if isinstance(job_required_skills, str):
            try:
                job_required_skills = json.loads(job_required_skills)
            except:
                job_required_skills = []
        
        candidate_skills_lower = [s.lower() for s in candidate_skills] if candidate_skills else []
        job_required_lower = [s.lower() for s in job_required_skills] if job_required_skills else []
        
        if candidate_skills_lower and job_required_lower:
            required_overlap = len(set(candidate_skills_lower) & set(job_required_lower))
            required_total = len(set(candidate_skills_lower) | set(job_required_lower))
            required_score = (required_overlap / required_total if required_total > 0 else 0) * 0.25
            score += required_score
            if required_score > 0:
                match_reasons.append(f"skills_required({required_overlap}/{len(job_required_lower)})")
        
        # 3. Title matching
        job_title = job.get('title', '').lower()
        if candidate_title in job_title or job_title in candidate_title:
            score += 0.2
            match_reasons.append("exact_title_match")
        elif 'developer' in candidate_title and 'developer' in job_title:
            score += 0.15
            match_reasons.append("developer_match")
        elif 'engineer' in candidate_title and 'engineer' in job_title:
            score += 0.15
            match_reasons.append("engineer_match")
        
        print(f"  {job.get('title', 'Unknown')} at {job.get('company', 'Unknown')}: Score={score:.2f}, Reasons={match_reasons}")
        
        if score > best_score:
            best_score = score
            best_match = job
    
    print(f"\nBEST MATCH: {best_match.get('title', 'Unknown')} at {best_match.get('company', 'Unknown')} (Score: {best_score:.2f})")
    print(f"Job Required Skills: {best_match.get('required_skills', [])}")
    print(f"Job Preferred Skills: {best_match.get('preferred_skills', [])}")

if __name__ == "__main__":
    asyncio.run(test_job_matching())
