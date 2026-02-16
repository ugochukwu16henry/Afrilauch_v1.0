#!/usr/bin/env node
'use strict';
// Usage: DATABASE_URL=postgresql://... node scripts/describe-table.js [table_name]
const table = (process.argv[2] || 'revenue_system_versions').replace(/[^a-zA-Z0-9_]/g, '');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sql = `SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '${table}'
ORDER BY ordinal_position`;

prisma.$queryRawUnsafe(sql)
  .then((rows) => {
    console.log('Table:', table);
    console.table(rows);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
