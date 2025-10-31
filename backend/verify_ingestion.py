#!/usr/bin/env python3
from pymilvus import connections, Collection, utility

# Connect to Milvus
connections.connect('default', uri='http://34.135.232.156:19530')

# Check if collection exists and count entities
if utility.has_collection('new_candidate_pool'):
    col = Collection('new_candidate_pool')
    col.load()
    count = col.num_entities
    print(f'✅ Collection exists with {count} candidates')
    
    # Get sample candidate
    results = col.query(
        expr='',
        limit=1,
        output_fields=['name', 'email', 'role_family', 'total_experience_years']
    )
    if results:
        candidate = results[0]
        print(f'📋 Sample candidate: {candidate.get("name", "Unknown")} ({candidate.get("role_family", "Unknown")})')
        print(f'   Email: {candidate.get("email", "N/A")}')
        print(f'   Experience: {candidate.get("total_experience_years", "N/A")} years')
else:
    print('❌ Collection not found')

