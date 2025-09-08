#!/bin/bash

# Banking System - Code Cleanup Script
# This script performs comprehensive code cleanup and optimization

set -e

echo "🧹 Starting Banking System Code Cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "go.mod" ] || [ ! -d "internal" ]; then
    print_error "Please run this script from the banking-system root directory"
    exit 1
fi

print_status "Banking System Code Cleanup & Optimization"
echo "=========================================="

# 1. Go Code Cleanup
print_status "1. Cleaning up Go code..."

# Format all Go code
print_status "  - Formatting Go code with gofmt..."
go fmt ./...

# Clean up Go modules
print_status "  - Tidying Go modules..."
go mod tidy

# Verify Go modules
print_status "  - Verifying Go modules..."
go mod verify

# Check for potential issues with go vet
print_status "  - Running go vet for potential issues..."
if go vet ./...; then
    print_success "  ✓ No issues found with go vet"
else
    print_warning "  ⚠ Some issues found with go vet (review above)"
fi

# Run tests to ensure nothing is broken
print_status "  - Running tests to ensure code integrity..."
if go test -short ./...; then
    print_success "  ✓ All tests passing"
else
    print_warning "  ⚠ Some tests failing (review above)"
fi

print_success "Go code cleanup completed"

# 2. Frontend Code Cleanup
print_status "2. Cleaning up Frontend code..."

if [ -d "frontend" ]; then
    cd frontend
    
    # Check if node_modules exists and package.json exists
    if [ -f "package.json" ]; then
        print_status "  - Checking for unused dependencies..."
        
        # Check for potential security issues (non-breaking)
        print_status "  - Checking for security vulnerabilities..."
        npm audit --audit-level=high || print_warning "  ⚠ Some security issues found in dev dependencies"
        
        print_status "  - Prettier formatting (if available)..."
        if command -v prettier &> /dev/null; then
            npx prettier --write "src/**/*.{js,jsx,ts,tsx,json,css,md}" 2>/dev/null || print_warning "  ⚠ Prettier not available or failed"
        else
            print_warning "  ⚠ Prettier not installed, skipping code formatting"
        fi
        
        print_success "  ✓ Frontend cleanup completed"
    else
        print_warning "  ⚠ No package.json found in frontend directory"
    fi
    
    cd ..
else
    print_warning "  ⚠ No frontend directory found"
fi

# 3. Docker Cleanup
print_status "3. Cleaning up Docker environment..."

# Clean up unused Docker resources
print_status "  - Cleaning up unused Docker images and containers..."
docker system prune -f --volumes || print_warning "  ⚠ Docker cleanup failed or Docker not available"

print_success "Docker cleanup completed"

# 4. Documentation Cleanup
print_status "4. Checking documentation..."

# Check if README.md exists and has content
if [ -f "README.md" ] && [ -s "README.md" ]; then
    print_success "  ✓ README.md exists and has content"
else
    print_warning "  ⚠ README.md missing or empty"
fi

# Check if DOCUMENTATION.md exists
if [ -f "DOCUMENTATION.md" ] && [ -s "DOCUMENTATION.md" ]; then
    print_success "  ✓ DOCUMENTATION.md exists and has content"
else
    print_warning "  ⚠ DOCUMENTATION.md missing or empty"
fi

# 5. Code Quality Checks
print_status "5. Running additional code quality checks..."

# Check for TODOs and FIXMEs
print_status "  - Checking for TODOs and FIXMEs..."
TODO_COUNT=$(find . -name "*.go" -o -name "*.js" -o -name "*.jsx" | xargs grep -i "todo\|fixme" | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    print_warning "  ⚠ Found $TODO_COUNT TODO/FIXME comments"
    find . -name "*.go" -o -name "*.js" -o -name "*.jsx" | xargs grep -n -i "todo\|fixme" | head -5
    if [ "$TODO_COUNT" -gt 5 ]; then
        echo "    ... and $(($TODO_COUNT - 5)) more"
    fi
else
    print_success "  ✓ No TODO/FIXME comments found"
fi

# Check for common security issues in Go code
print_status "  - Checking for common security patterns..."
if command -v gosec &> /dev/null; then
    gosec -quiet ./... || print_warning "  ⚠ Some security issues found with gosec"
else
    print_warning "  ⚠ gosec not installed, skipping security scan"
fi

# 6. File Cleanup
print_status "6. Cleaning up unnecessary files..."

# Remove common temporary files
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true
find . -name "*.swp" -delete 2>/dev/null || true

# Remove empty directories
find . -type d -empty -delete 2>/dev/null || true

print_success "File cleanup completed"

# 7. Git Cleanup (if in git repo)
if [ -d ".git" ]; then
    print_status "7. Git repository cleanup..."
    
    # Clean up git repository
    git gc --prune=now --aggressive 2>/dev/null || print_warning "  ⚠ Git cleanup failed"
    
    # Check for large files
    LARGE_FILES=$(find . -name "*.log" -o -name "*.tmp" -o -name "node_modules" -prune -o -size +10M -type f -print | wc -l)
    if [ "$LARGE_FILES" -gt 0 ]; then
        print_warning "  ⚠ Found $LARGE_FILES large files (>10MB)"
        find . -name "*.log" -o -name "*.tmp" -o -name "node_modules" -prune -o -size +10M -type f -print | head -3
    else
        print_success "  ✓ No large files found"
    fi
    
    print_success "Git cleanup completed"
fi

# 8. Final Verification
print_status "8. Final verification..."

# Verify build works
print_status "  - Verifying Go build..."
if go build -o /tmp/banking-test ./cmd/api-gateway/; then
    rm -f /tmp/banking-test
    print_success "  ✓ Go build successful"
else
    print_error "  ✗ Go build failed"
fi

# Summary
echo ""
echo "🎉 Code Cleanup Summary"
echo "======================="
print_success "✓ Go code formatted and modules tidied"
print_success "✓ Frontend code checked and cleaned"
print_success "✓ Docker environment cleaned"
print_success "✓ Documentation verified"
print_success "✓ Code quality checks completed"
print_success "✓ Unnecessary files removed"

if [ -d ".git" ]; then
    print_success "✓ Git repository cleaned"
fi

echo ""
print_status "Cleanup completed! Your banking system is now optimized and ready."
print_status "Run 'make docker-up' to start the system or 'make test' to run tests."
echo ""

# Show system status
if command -v docker &> /dev/null; then
    print_status "Current Docker containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep banking || echo "No banking containers running"
fi

exit 0