import os
import sys
import uvicorn

def main():
    # Get the absolute path of the backend-full directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Change to the backend directory
    os.chdir(backend_dir)
    
    # Add the current directory to Python path
    sys.path.insert(0, backend_dir)
    
    # Run the server
    uvicorn.run(
        "src.main:app",
        host="127.0.0.1",
        port=8804,
        reload=True
    )

if __name__ == "__main__":
    main()
