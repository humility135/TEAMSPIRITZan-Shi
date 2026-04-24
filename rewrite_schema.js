const fs = require('fs');
const path = require('path');
const dir = '/workspace/lib/db/src/schema';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  
  // Replace imports
  content = content.replace(/drizzle-orm\/pg-core/g, 'drizzle-orm/sqlite-core');
  content = content.replace(/pgTable/g, 'sqliteTable');
  
  // Replace types
  content = content.replace(/jsonb\("([^"]+)"\)/g, 'text("$1", { mode: "json" })');
  content = content.replace(/timestamp\("([^"]+)", \{[^}]+\}\)/g, 'integer("$1", { mode: "timestamp" })');
  content = content.replace(/boolean\("([^"]+)"\)/g, 'integer("$1", { mode: "boolean" })');
  content = content.replace(/serial\("([^"]+)"\)/g, 'integer("$1", { mode: "number" }).primaryKey({ autoIncrement: true })');
  content = content.replace(/real\("([^"]+)"\)/g, 'real("$1")');
  
  // Replace defaults
  content = content.replace(/\.default\(\{\}\)/g, '.default(sql`\'{}\'`)');
  content = content.replace(/\.default\(\[\]\)/g, '.default(sql`\'[]\'`)');
  content = content.replace(/\.defaultNow\(\)/g, '.$defaultFn(() => new Date())');
  
  // Array type to JSON
  content = content.replace(/text\("([^"]+)"\)\.array\(\)/g, 'text("$1", { mode: "json" })');

  if (content.includes('sql`') && !content.includes('import { sql }')) {
    content = 'import { sql } from "drizzle-orm";\n' + content;
  }
  
  fs.writeFileSync(path.join(dir, file), content);
}

// Modify index.ts
let index = fs.readFileSync('/workspace/lib/db/src/index.ts', 'utf8');
index = index.replace(/drizzle-orm\/node-postgres/g, 'drizzle-orm/libsql');
index = index.replace(/import pg from "pg";\nconst \{ Pool \} = pg;\n/g, 'import { createClient } from "@libsql/client";\n');
index = index.replace(/export const pool = new Pool\(\{ connectionString: process\.env\.DATABASE_URL \}\);\nexport const db = drizzle\(pool, \{ schema \}\);/g, 'export const client = createClient({ url: process.env.DATABASE_URL || "file:/workspace/local.db" });\nexport const db = drizzle(client, { schema });');
fs.writeFileSync('/workspace/lib/db/src/index.ts', index);

// Modify drizzle.config.ts
let config = fs.readFileSync('/workspace/lib/db/drizzle.config.ts', 'utf8');
config = config.replace(/dialect: "postgresql",/, 'dialect: "sqlite",');
fs.writeFileSync('/workspace/lib/db/drizzle.config.ts', config);

