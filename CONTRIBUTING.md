# Contributing to Recruiter.AI

## Development Setup

1. **Clone the Repository**

```bash
git clone https://github.com/yourusername/Recrutier.AI.git
cd Recrutier.AI
```

2. **Create Environment Files**

```bash
# Backend (.env)
MILVUS_URI=localhost:19530
API_KEY=your_api_key
JWT_SECRET=your_jwt_secret

# Frontend (.env.local)
VITE_API_URL=http://localhost:8080/api
```

3. **Setup Development Environment**

Backend:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Frontend:

```bash
cd frontend
npm install
```

4. **Start Development Services**

```bash
# Start Milvus and required services
docker-compose up -d

# Start backend (in one terminal)
uvicorn src.main:app --reload --port 8000

# Start frontend (in another terminal)
cd frontend
npm run dev
```

## Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production hotfixes

## Development Workflow

1. Create a new branch from `develop`:

```bash
git checkout develop
git pull
git checkout -b feature/your-feature
```

2. Make your changes and commit:

```bash
git add .
git commit -m "feat: description of your changes"
```

3. Push and create PR:

```bash
git push origin feature/your-feature
```

4. Create PR against `develop` branch

## Code Organization

```
Recrutier.AI/
├── src/                    # Backend source code
│   ├── api/               # API endpoints
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   └── utils/             # Utilities
├── frontend/              # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utilities
├── kubernetes/            # K8s configurations
└── tests/                 # Test suites
```

## Testing

Backend:

```bash
pytest tests/
```

Frontend:

```bash
cd frontend
npm test
```

## Code Style

- Backend: Follow PEP 8
- Frontend: Use ESLint and Prettier configs
- Use TypeScript for frontend development
- Write meaningful commit messages following Conventional Commits

## Environment Management

- Use `.env` files for local development
- Never commit sensitive information
- Use Kubernetes secrets for deployment
- Keep development and production configs separate

## Collaborative Development Tips

1. **Local Development**:

   - Use feature flags for WIP features
   - Keep changes small and focused
   - Document API changes

2. **Code Review**:

   - Review PRs promptly
   - Use PR templates
   - Write meaningful descriptions
   - Include test coverage

3. **Communication**:

   - Use PR comments for code-related discussion
   - Update task status in project board
   - Document architectural decisions

4. **Conflict Resolution**:
   - Rebase feature branches regularly
   - Communicate before large refactors
   - Use pair programming for complex features
