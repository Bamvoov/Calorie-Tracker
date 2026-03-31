#!/bin/bash

# Complete database and app setup script
echo "🚀 Complete AuraDiet Setup"
echo "========================="
echo ""

# Kill any existing dev server
echo "1️⃣ Stopping any running dev server..."
pkill -f "next dev" || true
sleep 2

# Ensure node_modules are complete
echo "2️⃣ Installing dependencies..."
npm install --legacy-peer-deps 2>&1 | grep -E "(up to date|added|removed)" || true
echo "✅ Dependencies ready"
echo ""

# Generate Prisma Client
echo "3️⃣ Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Remove old database if corrupted and sync schema
echo "4️⃣ Syncing database schema..."
rm -f prisma/dev.db
npx prisma db push --skip-generate --force-reset
echo "✅ Database ready"
echo ""

# Verify setup
echo "5️⃣ Verifying setup..."
echo "   - Database file: $([ -f prisma/dev.db ] && echo '✅ Found' || echo '❌ Missing')"
echo "   - Prisma schema: $([ -f prisma/schema.prisma ] && echo '✅ Found' || echo '❌ Missing')"
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next: Run 'npm run dev' and visit http://localhost:3000"
echo ""
