# Mithril Backend Tests

## Running Tests

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_job_flow.py

# Run specific test class
pytest tests/test_job_flow.py::TestJobSubmission

# Run with verbose output
pytest -v

# Run only unit tests (fast)
pytest -m "not integration"

# Run only integration tests
pytest -m integration
```

## Test Structure

```
tests/
├── conftest.py          # Shared fixtures (mocks, sample data)
├── test_core.py         # Core module tests (errors, retry, state machine)
├── test_providers.py    # Provider tests (Sora, Veo3)
├── test_job_flow.py     # Integration tests for job lifecycle
└── test_api_endpoints.py # API endpoint tests
```

## Test Categories

### Unit Tests
- `test_core.py` - Tests for error handling, retry logic, state machine
- `test_providers.py` - Tests for provider validation and constraints

### Integration Tests
- `test_job_flow.py` - End-to-end job lifecycle tests
- `test_api_endpoints.py` - API endpoint integration tests

## Fixtures

Key fixtures defined in `conftest.py`:
- `sample_job_request` - Sample JobSubmitRequest
- `sample_job_document` - Sample JobDocument
- `mock_provider` - Mock video provider (Sora/Veo3)
- `mock_firestore_job_service` - Mock Firestore service
- `mock_video_clip_service` - Mock video clip service
- `mock_s3_upload` - Mock S3 upload function
- `mock_settings` - Mock application settings

## Writing New Tests

1. Use `pytest.mark.asyncio` for async tests
2. Use fixtures for common setup
3. Mock external services (Firestore, S3, providers)
4. Test both success and error paths