# Resume Embedding Service

This service processes resume data and generates word embeddings using the Sentence Transformers library. It's designed to run in a Kubernetes environment and includes a complete CI/CD pipeline.

## Features

- Resume text processing and cleaning
- Word embedding generation using Sentence Transformers
- Kubernetes deployment configuration
- GitHub Actions CI/CD pipeline
- Docker containerization

## New Features

- **PDF Resume Support:** Extracts text from PDF resumes in a specified directory and generates embeddings.

## Project Structure

```
.
├── src/
│   └── embedding_processor.py
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
   - CSV: Place your file in the project root

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
   - CSV: Place your file in the project root

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
  python src/embedding_processor.py --csv UpdatedResumeDataSet.csv
  ```
- **Any combination:**
  ```sh
  python src/embedding_processor.py --csv UpdatedResumeDataSet.csv --pdf_dir pdf_resumes --docx_dir docx_resumes
  ```

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
