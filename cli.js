#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { compiler } from './src/index.js';

// Standard runtime library functions for generated code
const RUNTIME_PREAMBLE = `// --- MyLang Standard Runtime ---
const add = (a, b) => a + b;
const subtract = (a, b) => a - b;
const multiply = (a, b) => a * b;
const divide = (a, b) => a / b;
const concat = (...args) => args.join('');
// -------------------------------\n\n`;

function showHelp() {
    console.log(`
MyLang CLI Compiler

Usage:
  node cli.js <filename> [options]
  node cli.js run <filename>

Options:
  -o, --output <file>    Specify custom output file path (default: <filename>.js)
  -r, --run              Compile and immediately execute the output file
  --no-runtime           Do not include built-in runtime functions in output
  -h, --help             Show this help message

Examples:
  node cli.js example.my
  node cli.js example.my --run
  node cli.js example.my -o dist/app.js -r
`);
}

const rawArgs = process.argv.slice(2);

if (rawArgs.length === 0 || rawArgs.includes('-h') || rawArgs.includes('--help')) {
    if (rawArgs.length === 0) {
        console.error('❌ Error: Please provide a file path.');
    }
    showHelp();
    process.exit(rawArgs.length === 0 ? 1 : 0);
}

// Parse command-line arguments
let filePath = null;
let outputPath = null;
let shouldRun = false;
let includeRuntime = true;

for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === 'run' || arg === '-r' || arg === '--run') {
        shouldRun = true;
    } else if (arg === '-o' || arg === '--output') {
        outputPath = rawArgs[++i];
    } else if (arg === '--no-runtime') {
        includeRuntime = false;
    } else if (!arg.startsWith('-') && !filePath) {
        filePath = arg;
    }
}

if (!filePath) {
    console.error('❌ Error: Please provide a file path.');
    console.log('💡 Usage: node cli.js <filename>');
    process.exit(1);
}

try {
    // 1. Resolve absolute path and read source file
    const absolutePath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ Error: File not found: ${filePath}`);
        process.exit(1);
    }

    const sourceCode = fs.readFileSync(absolutePath, 'utf-8');

    console.log(`🚀 Compiling file: ${filePath}...\n`);

    // 2. Run compiler pipeline
    const output = compiler(sourceCode);
    const outputCode = typeof output === 'string' ? output : JSON.stringify(output, null, 2);

    // 3. Print compiler output
    console.log('--- Compiler Output ---');
    console.log(outputCode);
    console.log('-----------------------\n');

    // 4. Determine output file path
    if (!outputPath) {
        const parsed = path.parse(absolutePath);
        const newExt = parsed.ext === '.js' ? '.compiled.js' : '.js';
        outputPath = path.join(parsed.dir, `${parsed.name}${newExt}`);
    } else {
        outputPath = path.resolve(process.cwd(), outputPath);
    }

    // 5. Ensure output directory exists and write executable file
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const executableContent = includeRuntime ? `${RUNTIME_PREAMBLE}${outputCode}\n` : `${outputCode}\n`;
    fs.writeFileSync(outputPath, executableContent, 'utf-8');

    const relativeOut = path.relative(process.cwd(), outputPath);
    console.log(`📦 Saved executable output to: ${relativeOut}`);

    // 6. Execute if --run flag was provided
    if (shouldRun) {
        console.log(`\n▶ Running compiled program (${relativeOut}):`);
        console.log('============================================');
        const runProcess = spawnSync(process.execPath, [outputPath], {
            stdio: 'inherit'
        });
        console.log('============================================');
        if (runProcess.error) {
            console.error(`❌ Execution Error: ${runProcess.error.message}`);
            process.exit(1);
        }
        process.exit(runProcess.status ?? 0);
    } else {
        console.log(`💡 To run the compiled file:`);
        console.log(`   node ${relativeOut}`);
        console.log(`   or compile & run directly with: node cli.js ${filePath} --run\n`);
    }

} catch (error) {
    console.error(`❌ Compilation Failed: ${error.message}`);
    process.exit(1);
}
