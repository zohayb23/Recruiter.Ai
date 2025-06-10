# Recrutier.AI

An advanced resume search and matching system that combines full-text and semantic search capabilities.

## Features

- **Dual Search Engine**:

  - Full-text search using BM25 algorithm
  - Semantic search using dense embeddings
  - Hybrid search capabilities

- **Boolean Search Builder**:
  - Visual boolean query builder
  - Support for AND, OR, NOT operators
  - Grouping with parentheses
  - Template saving and management
  - Real-time skill suggestions

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

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/Recrutier.AI.git
cd Recrutier.AI
```

2. Create and activate virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start Milvus:

```bash
docker-compose -f docker-compose-milvus.yml up -d
```

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

The boolean search builder provides a user-friendly interface for creating complex search queries:

- **Visual Query Building**:
  - Drag-and-drop interface for query construction
  - Real-time preview of search results
  - Support for nested boolean operations

- **Template Management**:
  - Save frequently used search patterns
  - Load and modify existing templates
  - Share templates across team members

- **Skill Suggestions**:
  - Auto-complete for skill input
  - Standardized skill terminology
  - Skill relevance indicators
