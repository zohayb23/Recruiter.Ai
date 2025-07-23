import requests
import os

def upload_resume(file_path):
    url = "http://localhost:8804/api/resume-parser/parse"
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
        
        print(f"Status code: {response.status_code}")
        print("Response:", response.json())

if __name__ == "__main__":
    file_path = "fwdsampleresumes/Gary Jiang - Business Analyst.rtf"
    upload_resume(file_path) 