# Contributing to Recruiter.AI

We love your input! We want to make contributing to Recruiter.AI as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable.
2. Update the requirements.txt or package.json with any new dependencies.
3. The PR will be merged once you have the sign-off of at least one other developer.

## Code Style

### Python
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Use type hints
- Document functions and classes using docstrings
- Maximum line length: 100 characters

Example:
```python
from typing import List, Optional

def parse_resume(file_path: str) -> Optional[dict]:
    """
    Parse a resume file and extract structured information.

    Args:
        file_path: Path to the resume file

    Returns:
        Dictionary containing parsed resume data or None if parsing fails
    """
    try:
        # Implementation
        pass
    except Exception as e:
        logger.error(f"Failed to parse resume: {e}")
        return None
```

### TypeScript/React
- Use ESLint and Prettier
- Follow Airbnb Style Guide
- Use functional components and hooks
- Use TypeScript interfaces for props

Example:
```typescript
interface ResumeViewerProps {
  resumeId: string;
  onClose: () => void;
}

const ResumeViewer: React.FC<ResumeViewerProps> = ({ resumeId, onClose }) => {
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    // Implementation
  }, [resumeId]);

  return (
    // JSX
  );
};
```

## Testing

### Backend Tests
- Use pytest for Python tests
- Maintain test coverage above 80%
- Mock external services
- Use fixtures for common test data

Example:
```python
import pytest
from unittest.mock import Mock

@pytest.fixture
def mock_milvus_service():
    return Mock()

def test_resume_parser(mock_milvus_service):
    # Test implementation
    pass
```

### Frontend Tests
- Use Jest and React Testing Library
- Test component rendering and user interactions
- Mock API calls using MSW

Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumeUploader } from './ResumeUploader';

describe('ResumeUploader', () => {
  it('handles file upload correctly', async () => {
    // Test implementation
  });
});
```

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
feat: Add resume parsing for RTF files

- Implement RTF text extraction
- Add unit tests for RTF parsing
- Update documentation

Fixes #123
```

## Issue and Feature Request Process

### Bug Reports
When filing an issue, make sure to answer these questions:

1. What version of the software are you using?
2. What operating system and processor architecture are you using?
3. What did you do?
4. What did you expect to see?
5. What did you see instead?

### Feature Requests
1. Explain the problem you want to solve
2. Explain your proposed solution
3. Provide examples of how the feature would be used
4. Consider the impact on existing features

## Documentation

- Update README.md for any user-facing changes
- Update API documentation for endpoint changes
- Add comments for complex logic
- Update configuration examples

## Environment Setup

1. Install development tools:
```bash
# Install Python dependencies
pip install -r requirements-dev.txt

# Install Node.js dependencies
npm install --include=dev
```

2. Set up pre-commit hooks:
```bash
pre-commit install
```

3. Configure your IDE:
- VSCode settings are provided in .vscode/
- Use Black formatter for Python
- Use Prettier for TypeScript/JavaScript

## Branch Naming Convention

- Feature branches: `feature/description`
- Bug fix branches: `fix/description`
- Documentation branches: `docs/description`
- Performance improvement branches: `perf/description`

Example: `feature/rtf-resume-parsing`

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Milvus Documentation](https://milvus.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
