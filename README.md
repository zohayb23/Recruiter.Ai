# Resume Embedding Service

This service processes resume data and generates word embeddings using the Sentence Transformers library. It's designed to run in a Kubernetes environment and includes a complete CI/CD pipeline.

## Features

- Resume text processing and cleaning
- Word embedding generation using Sentence Transformers
- Kubernetes deployment configuration
- GitHub Actions CI/CD pipeline
- Docker containerization

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
