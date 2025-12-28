#!/bin/bash
# PyPI Upload Script for senseai package

set -e

echo "🚀 Publishing senseai to PyPI"
echo "================================"
echo ""

# Activate virtual environment
source venv/bin/activate

# Check packages
echo "📦 Validating packages..."
python -m twine check dist/*
echo "✅ Packages validated successfully"
echo ""

# Upload to PyPI
echo "📤 Uploading to PyPI..."
echo ""
echo "You will be prompted for your PyPI credentials:"
echo "  Username: __token__"
echo "  Password: Your PyPI API token (starts with pypi-)"
echo ""
echo "If you don't have a PyPI API token:"
echo "  1. Go to https://pypi.org/manage/account/token/"
echo "  2. Create a new API token"
echo "  3. Copy the token (it starts with 'pypi-')"
echo ""

python -m twine upload dist/*

echo ""
echo "✅ Package published successfully!"
echo ""
echo "Users can now install with:"
echo "  pip install senseai"
echo ""
echo "Verify at: https://pypi.org/project/senseai/"
