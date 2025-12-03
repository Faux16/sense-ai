# Publishing to PyPI

This guide walks you through publishing the `senseai` package to PyPI.

## Prerequisites

1. **PyPI Account**: Create accounts on both [TestPyPI](https://test.pypi.org/account/register/) and [PyPI](https://pypi.org/account/register/)

2. **API Tokens**: Generate API tokens for authentication:
   - TestPyPI: https://test.pypi.org/manage/account/token/
   - PyPI: https://pypi.org/manage/account/token/

3. **Install Twine**:
   ```bash
   pip install twine
   ```

## Step 1: Build the Package

```bash
cd python
source venv/bin/activate
python -m build
```

This creates:
- `dist/senseai-0.1.0-py3-none-any.whl` (wheel)
- `dist/senseai-0.1.0.tar.gz` (source distribution)

## Step 2: Test with TestPyPI (Recommended)

### Upload to TestPyPI

```bash
python -m twine upload --repository testpypi dist/*
```

When prompted:
- Username: `__token__`
- Password: Your TestPyPI API token (starts with `pypi-`)

### Test Installation

```bash
# Create a fresh virtual environment
python3 -m venv test_env
source test_env/bin/activate

# Install from TestPyPI
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ senseai

# Test it works
senseai --version
senseai --help
```

> **Note**: The `--extra-index-url` is needed because dependencies (requests, click, etc.) are not on TestPyPI.

## Step 3: Publish to Production PyPI

Once you've verified everything works on TestPyPI:

```bash
python -m twine upload dist/*
```

When prompted:
- Username: `__token__`
- Password: Your PyPI API token

## Step 4: Verify Installation

```bash
# In a fresh environment
pip install senseai

# Test
senseai --version
```

## Step 5: Create GitHub Release

1. **Tag the release**:
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0 - Python PyPI wrapper"
   git push origin v0.1.0
   ```

2. **Build Go binaries for all platforms**:
   ```bash
   # macOS ARM64 (M1/M2)
   GOOS=darwin GOARCH=arm64 go build -o sense-darwin-arm64 cmd/sense/main.go
   
   # macOS AMD64 (Intel)
   GOOS=darwin GOARCH=amd64 go build -o sense-darwin-amd64 cmd/sense/main.go
   
   # Linux AMD64
   GOOS=linux GOARCH=amd64 go build -o sense-linux-amd64 cmd/sense/main.go
   
   # Linux ARM64
   GOOS=linux GOARCH=arm64 go build -o sense-linux-arm64 cmd/sense/main.go
   
   # Windows AMD64
   GOOS=windows GOARCH=amd64 go build -o sense-windows-amd64.exe cmd/sense/main.go
   ```

3. **Create GitHub Release**:
   - Go to: https://github.com/Faux16/sense-ai/releases/new
   - Choose tag: `v0.1.0`
   - Release title: `v0.1.0 - Python PyPI Wrapper`
   - Description: Include changelog and features
   - Upload all binary files

## Step 6: Update Main README

Add PyPI installation instructions to the main project README:

```markdown
## Installation

### Option 1: Python Package (Recommended)

Install via pip:
\`\`\`bash
pip install senseai
\`\`\`

Then use the CLI:
\`\`\`bash
senseai start --port 8080
\`\`\`

Or use the Python API:
\`\`\`python
from senseai import SenseClient, SenseServer

with SenseServer(port=8080) as server:
    client = SenseClient()
    findings = client.get_findings()
    print(findings)
\`\`\`

### Option 2: Build from Source

[Existing Go build instructions...]
```

## Troubleshooting

### Upload Fails with "File already exists"

If you need to re-upload:
1. Increment version in `pyproject.toml`
2. Rebuild: `python -m build`
3. Upload again

### Binary Download Fails for Users

Ensure GitHub Release binaries are named exactly:
- `sense-darwin-arm64`
- `sense-darwin-amd64`
- `sense-linux-amd64`
- `sense-linux-arm64`
- `sense-windows-amd64.exe`

The Python package expects these exact names.

## Continuous Deployment (Optional)

Set up GitHub Actions to automatically publish on release:

```yaml
# .github/workflows/publish.yml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          pip install build twine
      - name: Build package
        run: |
          cd python
          python -m build
      - name: Publish to PyPI
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}
        run: |
          cd python
          python -m twine upload dist/*
```

Add `PYPI_API_TOKEN` to repository secrets.
