# Recrutier.AI

An advanced resume search and matching system that combines full-text, semantic, and boolean search capabilities.

## Features

- **Dual Search Engine**:

  - Full-text search using BM25 algorithm
  - Semantic search using dense embeddings
  - Hybrid search capabilities

- **Boolean Search System** (New in feature/boolean-search):
  - Visual boolean query builder with intuitive UI
  - Support for complex boolean expressions (AND, OR, NOT)
  - Nested grouping with parentheses
  - Real-time skill suggestions and validation
  - Search template management
  - Advanced skill matching algorithms

- **Multiple Format Support**:

  - PDF resumes
  - DOCX resumes
  - CSV resume datasets

- **Advanced Search Capabilities**:
  - Boolean operations (AND, OR)
  - Semantic similarity matching
  - Role-based search
  - Skill-based search
  - Education matching
  - Experience level correlation

## Project Structure

```
Recruiter.AI/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx         # Main layout component
│   │   │   ├── pages/
│   │   │   │   ├── BooleanSearch.tsx  # Boolean search builder
│   │   │   │   └── Templates.tsx      # Search templates management
│   │   │   ├── store/
│   │   │   │   └── searchSlice.ts     # Redux state management
│   │   │   ├── types/
│   │   │   │   └── index.ts           # TypeScript type definitions
│   │   │   ├── App.tsx                # Main application component
│   │   │   └── index.tsx              # Application entry point
│   │   └── package.json               # Frontend dependencies
│   └── backend/
│       ├── services/
│       │   ├── search.py              # Search service implementation
│       │   └── skill_embeddings.py    # Skill embedding generation
│       └── main.py                    # Backend entry point
└── README.md                      # Project documentation
```

## Technical Stack

- Python 3.8+
- Milvus Vector Database
- Sentence Transformers
- PyMilvus
- PDFPlumber
- Python-docx

## Quick Start Guide

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- Docker and Docker Compose
- Git

### Installation Steps

1. Clone the repository and switch to boolean search feature branch:
```bash
git clone https://github.com/zohayb23/Recruiter.Ai.git
cd Recruiter.AI
git checkout feature/boolean-search
```

2. Set up the Backend:
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

3. Set up the Frontend:
```bash
# Install frontend dependencies
cd frontend
npm install
```

4. Start the Services:
```bash
# Start the database and other services
docker-compose up -d

# Start the backend server (in backend directory)
cd backend
uvicorn main:app --reload

# Start the frontend development server (in frontend directory)
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Docker Deployment

To run the entire application using Docker:

```bash
# Build and start all services
docker-compose up --build -d
```

This will start:
- Frontend container
- Backend container
- Database and other required services

## Usage

### 1. Process Resumes

Place your resumes in the appropriate folders:

- PDFs: `pdf_resumes/`
- DOCX: `docx_resumes/`
- CSV: `csv_resumes/`

Run the embedding processor:

```bash
python src/embedding_processor.py --csv csv_resumes --pdf_dir pdf_resumes --docx_dir docx_resumes
```

### 2. Search Resumes

#### Full Text Search

```python
from full_text_search import search_resumes

results = search_resumes("Java Developer", top_k=5)
```

#### Dense Search

```python
from dense_search import dense_search

results = dense_search("Java Developer", top_k=5)
```

### 3. Run Tests

```bash
# Full text search tests
python test_full_text_edge_cases.py

# Dense search tests
python test_dense_edge_cases.py
```

## Search Capabilities

### Full Text Search

- Boolean operations (AND, OR)
- Special character handling
- Wildcard pattern matching
- Whitespace normalization
- Score range: 1-14

### Dense Search

- Semantic understanding
- Concept matching
- Role similarity
- Education matching
- Experience level correlation
- Score range: 0.7-1.7

## Performance

- **Full Text Search**:

  - Execution time: ~11 seconds
  - Best for exact matches
  - Better snippet generation

- **Dense Search**:
  - Execution time: ~0.5 seconds
  - Best for semantic matching
  - Better context understanding

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Milvus for vector database capabilities
- Sentence Transformers for semantic search
- All contributors and users of the project

## Boolean Search Features

The boolean search system provides a sophisticated interface for creating and managing complex search queries:

### Query Building
- **Visual Query Builder**:
  - Drag-and-drop interface for query construction
  - Real-time query validation and preview
  - Support for nested boolean operations (AND, OR, NOT)
  - Parentheses grouping for complex expressions

- **Skill Management**:
  - Auto-complete suggestions for skills
  - Standardized skill terminology
  - Skill relevance indicators
  - Skill synonyms and variations handling

- **Template System**:
  - Save and manage frequently used search patterns
  - Load and modify existing templates
  - Share templates across team members
  - Template categories and tagging

### Search Capabilities
- **Advanced Boolean Operations**:
  - AND: Match all specified criteria
  - OR: Match any of the specified criteria
  - NOT: Exclude specific criteria
  - Nested grouping: (Skill1 AND Skill2) OR (Skill3 AND Skill4)

- **Skill Matching**:
  - Exact skill matches
  - Skill level consideration
  - Experience duration matching
  - Related skills detection

### Performance Optimization
- Efficient boolean expression evaluation
- Cached skill suggestions
- Optimized query parsing
- Real-time result updates

### Usage Example
```typescript
// Example boolean search query
const query = {
  operator: 'AND',
  children: [
    {
      operator: 'OR',
      children: ['React', 'Angular', 'Vue']
    },
    {
      operator: 'AND',
      children: ['TypeScript', 'Node.js']
    },
    {
      operator: 'NOT',
      children: ['PHP']
    }
  ]
};
```

This query would find candidates who:
- Know either React, Angular, or Vue
- AND have experience with both TypeScript and Node.js
- AND do not list PHP as a skill
