#!/bin/bash

echo "🔍 Checking Integration..."

# Check if components exist
echo "✓ Checking components..."
if [ -d "client/src/components" ]; then
  echo "  ✓ Components directory exists"
else
  echo "  ✗ Components directory missing"
  exit 1
fi

# Check if hooks exist
echo "✓ Checking hooks..."
if [ -d "client/src/hooks" ]; then
  echo "  ✓ Hooks directory exists"
else
  echo "  ✗ Hooks directory missing"
  exit 1
fi

# Check backend handlers
echo "✓ Checking backend handlers..."
if [ -d "backend/handlers" ]; then
  echo "  ✓ Handlers directory exists"
else
  echo "  ✗ Handlers directory missing"
  exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "📝 Next steps:"
echo "1. cd client && npm start"
echo "2. cd backend && npm start"
echo "3. Test the application"
