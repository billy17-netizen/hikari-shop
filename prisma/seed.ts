import { PrismaClient } from '../src/generated/prisma';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Database configuration from db.ts
const DATABASE_URL = "postgresql://postgres:choisiwon@localhost:5432/hikarishop?schema=public";

// Initialize Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

// Function to split SQL into individual statements
function splitSqlStatements(sql: string): string[] {
  // This regex splits on semicolons but ignores those within quoted strings or array literals
  const statements: string[] = [];
  let currentStatement = '';
  let inString = false;
  let inArray = false;
  let stringChar = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';
    
    // Handle string literals
    if ((char === "'" || char === '"') && sql[i - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }
    
    // Handle array literals
    if (char === '[' && !inString) {
      inArray = true;
    } else if (char === ']' && !inString) {
      inArray = false;
    }
    
    // Add character to current statement
    currentStatement += char;
    
    // If we hit a semicolon outside of string/array and it's not part of a PL/pgSQL definition
    if (char === ';' && !inString && !inArray && !currentStatement.trim().startsWith('CREATE FUNCTION')) {
      const trimmedStatement = currentStatement.trim();
      if (trimmedStatement.length > 1) { // Not just a semicolon
        statements.push(trimmedStatement);
      }
      currentStatement = '';
    }
  }
  
  // Add the last statement if there's one without semicolon
  const trimmedStatement = currentStatement.trim();
  if (trimmedStatement.length > 0 && trimmedStatement !== ';') {
    statements.push(trimmedStatement);
  }
  
  return statements.filter(stmt => stmt.length > 0);
}

async function runSettingsSeed() {
  console.log('Running settings seed...');
  try {
    const settingsPath = path.join(__dirname, 'seed-settings.ts');
    
    // Check if the file exists
    if (!fs.existsSync(settingsPath)) {
      throw new Error(`Settings seed file not found at ${settingsPath}`);
    }
    
    // Execute the settings seed with ts-node
    const { stdout, stderr } = await execPromise(`npx ts-node ${settingsPath}`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('Settings seed completed successfully!');
  } catch (error) {
    console.error('Error running settings seed:', error);
    throw error;
  }
}

async function main() {
  console.log('Starting database seed...');

  try {
    // Path to the seed SQL file
    const seedFilePath = path.join(__dirname, 'sql', 'seed.sql');
    
    // Check if the file exists
    if (!fs.existsSync(seedFilePath)) {
      throw new Error(`Seed file not found at ${seedFilePath}`);
    }
    
    // Get the SQL content
    const seedSQL = fs.readFileSync(seedFilePath, 'utf8');
    
    // Split into individual statements
    const statements = splitSqlStatements(seedSQL);
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement individually
    console.log('Executing SQL statements...');
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await prisma.$executeRawUnsafe(stmt);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        throw error;
      }
    }
    
    // Run the settings seed after main seed
    await runSettingsSeed();
    
    console.log('All seeds completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 