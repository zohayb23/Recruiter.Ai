# Resume Embedding Service

This service processes resume data and generates word embeddings using the Sentence Transformers library. It's designed to run in a Kubernetes environment and includes a complete CI/CD pipeline.

## Features

- Resume text processing and cleaning
- Word embedding generation using Sentence Transformers
- **CSV Resume Support:** Process resumes from CSV files
- **PDF Resume Support:** Extracts text from PDF resumes in a specified directory and generates embeddings
- **DOCX Resume Support:** Extracts text from DOCX resumes in a specified directory and generates embeddings
- **Milvus Integration:** Stores generated embeddings in a Milvus vector database for scalable search and retrieval
- **Skill Rating System:** Advanced matching system that rates resumes against job descriptions with detailed skill analysis
- Kubernetes deployment configuration
- GitHub Actions CI/CD pipeline
- Docker containerization

## New Features

- **Relative Resume Directories:** By default, the application now looks for resumes in the `csv_resumes`, `pdf_resumes`, and `docx_resumes` folders in the project root. No need to edit code for your local path—just place your files in these folders or specify your own paths with command-line arguments.
- **Batch CSV Processing:** The application will now process all `.csv` files in the `csv_resumes` directory, not just a single file.
- **Milvus Integration:** Embeddings are stored in Milvus for scalable vector search
- **DOCX Resume Support:** DOCX files are supported for extraction and embedding
- **Cross-platform Setup:** Updated instructions for Windows and Mac
- **Dense Search Filtering by Source:** You can now filter dense search results by resume source (pdf, docx, csv) using the `ONLY_PDF_AND_DOCX` parameter in `dense_search.py`. This allows you to focus your search on specific resume types for more targeted results.
- **Skill Rating System:** New intelligent system that analyzes resumes against job descriptions, providing detailed skill matches and overall compatibility scores.

## Project Structure

```
.
├── src/
│   ├── embedding_processor.py
│   ├── skill_ratings.py
│   └── test_skill_ratings.py
├── kubernetes/
│   └── deployment.yaml
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── data/
│   └── embeddings/
├── requirements.txt
├── Dockerfile
└── README.md
```

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the embedding processor:

```bash
python src/embedding_processor.py
```

## Installation

### Windows

1. Install Python 3.10 (recommended):
   - Download from https://www.python.org/downloads/release/python-3100/
2. Clone the repository:
   ```sh
   git clone https://github.com/zohayb23/Recruiter.Ai.git
   cd Recruiter.Ai
   ```
3. Create and activate a virtual environment:
   ```sh
   python -m venv .venv
   .venv\Scripts\activate
   ```
4. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
5. Place your resumes in the appropriate folders:
   - PDFs: `pdf_resumes/`
   - DOCX: `docx_resumes/`
   - CSV: Place your `.csv` files in the `csv_resumes/` folder

### Mac

1. Install Python 3.10 (recommended):
   - Download from https://www.python.org/downloads/release/python-3100/
   - Or use Homebrew: `brew install python@3.10`
2. (Optional) Install Homebrew if you don't have it: https://brew.sh/
3. Clone the repository:
   ```sh
   git clone https://github.com/zohayb23/Recruiter.Ai.git
   cd Recruiter.Ai
   ```
4. Create and activate a virtual environment:
   ```sh
   python3.10 -m venv .venv
   source .venv/bin/activate
   ```
5. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
6. Place your resumes in the appropriate folders:
   - PDFs: `pdf_resumes/`
   - DOCX: `docx_resumes/`
   - CSV: Place your `.csv` files in the `csv_resumes/` folder

## Usage

- **PDF resumes:**
  ```sh
  python src/embedding_processor.py --pdf_dir pdf_resumes
  ```
- **DOCX resumes:**
  ```sh
  python src/embedding_processor.py --docx_dir docx_resumes
  ```
- **CSV resumes:**
  ```sh
  python src/embedding_processor.py --csv csv_resumes
  ```
- **Any combination:**
  ```sh
  python src/embedding_processor.py --csv csv_resumes --pdf_dir pdf_resumes --docx_dir docx_resumes
  ```

### Dense Search Filtering by Source

You can control which resume types are included in dense search results using the `ONLY_PDF_AND_DOCX` parameter in `dense_search.py`:

- To search **only PDF and DOCX resumes** (exclude CSV):
  ```python
  ONLY_PDF_AND_DOCX = True
  ```
- To search **all resume types** (CSV, PDF, DOCX):
  ```python
  ONLY_PDF_AND_DOCX = False
  ```

This uses the Milvus `expr` parameter to efficiently filter results at the database level.

### Skill Rating System

The Skill Rating System provides advanced resume matching against job descriptions. To use this feature:

1. Ensure your resumes are processed and Milvus is running:
   ```sh
   docker compose -f docker-compose-milvus.yml up -d
   python src/embedding_processor.py --csv csv_resumes --docx_dir docx_resumes
   ```

2. Use the skill rating system:
   ```sh
   python test_skill_ratings.py
   ```

The system will:
- Analyze job descriptions for required skills and qualifications
- Match resumes against these requirements
- Provide detailed skill-by-skill matching scores
- Calculate overall compatibility ratings
- Rank candidates based on their match to the job requirements

You can customize job descriptions and skill requirements by modifying the test cases in `test_skill_ratings.py`.

Example output:
```
=== Testing Senior Software Engineer Role ===
Job Description:
[Your job description here]

Top Matches:
Candidate #1:
- File: resume1.pdf
- Overall Score: 0.85
- Key Matches:
  * JavaScript/TypeScript: Strong match
  * React.js: Found
  * Cloud Platforms: AWS experience
  [etc...]
```

> **Note:**
> The skill rating system uses advanced NLP techniques to understand variations in skill descriptions and technical terminology, providing more accurate matches than simple keyword matching.

## Deployment

The project includes Kubernetes configurations and can be deployed to any Kubernetes cluster. The CI/CD pipeline automatically builds and deploys to EKS when changes are pushed to the main branch.

### Prerequisites

- Docker
- Kubernetes cluster
- AWS CLI (for EKS deployment)
- GitHub Secrets configured:
  - DOCKER_HUB_USERNAME
  - DOCKER_HUB_ACCESS_TOKEN
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY

## Word Embeddings

The project uses the `all-MiniLM-L6-v2` model from Sentence Transformers to generate embeddings. This model provides a good balance between performance and accuracy for resume text processing.

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
