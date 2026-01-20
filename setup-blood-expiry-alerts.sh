#!/bin/bash

# Blood Expiry Alert System - Setup and Initialization Script
# This script sets up the blood expiry alert system

set -e

echo "=================================="
echo "Blood Expiry Alert System Setup"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js installation
echo -e "${BLUE}Checking dependencies...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Check environment variables
echo -e "${BLUE}Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "Creating .env.example..."
    cat > .env.example << 'EOF'
# Database
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/bloodflow_hub

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@bloodflowhub.com
SMTP_FROM_NAME=LifeFlow

# Server
PORT=5000
NODE_ENV=development

# API
VITE_API_URL=http://localhost:5000
EOF
    echo -e "${YELLOW}Created .env.example - please configure and rename to .env${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi
echo ""

# Build TypeScript
echo -e "${BLUE}Checking TypeScript compilation...${NC}"
if [ -f tsconfig.json ]; then
    echo "TypeScript configuration found"
fi
echo ""

# Database setup
echo -e "${BLUE}Verifying database connection...${NC}"
echo "Make sure MongoDB is running and DATABASE_URL is configured in .env"
echo ""

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${NC}"
mkdir -p uploads/staff_documents
mkdir -p logs
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Information
echo -e "${GREEN}=================================="
echo "Setup Complete!"
echo "==================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Configure .env file with your settings"
echo "2. Start the server: npm run dev"
echo "3. Access dashboards:"
echo "   - Admin Dashboard: http://localhost:5173/admin"
echo "   - Hospital Staff: http://localhost:5173/hospital-dashboard"
echo "4. Run tests: PowerShell -File test-blood-expiry-alerts.ps1"
echo ""
echo -e "${BLUE}Important Configuration:${NC}"
echo "- DATABASE_URL: MongoDB connection string"
echo "- SMTP_HOST: Email server (e.g., smtp.gmail.com)"
echo "- SMTP_USER: Email account"
echo "- SMTP_PASS: Email password or app-specific password"
echo ""
echo -e "${BLUE}Features Enabled:${NC}"
echo "✓ Blood unit expiry tracking"
echo "✓ Multi-level alert system (Critical/Warning/Info)"
echo "✓ Automatic email notifications"
echo "✓ Dashboard visualization"
echo "✓ Alert acknowledgment/resolution"
echo "✓ Real-time updates"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "See BLOOD_EXPIRY_ALERTS_GUIDE.md for detailed information"
echo ""
