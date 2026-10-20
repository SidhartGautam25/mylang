# MyLang Compiler

A modular compiler built from scratch in JavaScript (ES Modules). It takes C/JavaScript-style expressions—such as `add(2, subtract(4, 2))`—and compiles them through a classic multi-stage compiler pipeline into formatted target JavaScript code.

---

## Table of Contents

1. [Architecture Overview & Pipeline](#architecture-overview--pipeline)
2. [1. Tokenizer (Lexical Analysis)](#1-tokenizer-lexical-analysis)
3. [2. Parser (Syntactic Analysis)](#2-parser-syntactic-analysis)
4. [3. Traverser (AST Walker)](#3-traverser-ast-walker)
5. [4. Visitor (Transformation Actions)](#4-visitor-transformation-actions)
6. [5. Transformer (AST-to-AST Conversion)](#5-transformer-ast-to-ast-conversion)
7. [6. Code Generator (Code Emission)](#6-code-generator-code-emission)
8. [Centralized Error Handling](#centralized-error-handling)
9. [Complete End-to-End Walkthrough](#complete-end-to-end-walkthrough)
10. [Usage and Testing](#usage-and-testing)

---

## Architecture Overview & Pipeline

A compiler is a program that translates code from a source language into a target language. The MyLang compiler breaks this complex task into clean, isolated stages:

```
┌───────────────────────────────┐
│          Source Code          │  e.g. "add(2, subtract(4, 2))"
└──────────────┬────────────────┘
               │
               ▼  1. Tokenizer (Lexical Analysis)
┌───────────────────────────────┐
│         Token Stream          │  Array of tokens: [name, paren, number, comma, ...]
└──────────────┬────────────────┘
               │
               ▼  2. Parser (Syntactic Analysis)
┌───────────────────────────────┐
│           Input AST           │  Abstract Syntax Tree representing source expressions
└──────────────┬────────────────┘
               │
               ▼  3 & 4 & 5. Transformer (via Traverser + Visitor)
┌───────────────────────────────┐
│          Target AST           │  ESTree-compliant JavaScript AST
└──────────────┬────────────────┘
               │
               ▼  6. Code Generator
┌───────────────────────────────┐
│         Output Code           │  "add(2, subtract(4, 2));"
└───────────────────────────────┘
```

---

## 1. Tokenizer (Lexical Analysis)

- **File**: `src/tokenizer.js`
- **Role**: Reads the raw text character by character and turns it into an array of meaningful atomic elements called **tokens**. It discards insignificant whitespace and records source positions (line and column numbers).

### Supported Token Types

| Token Type | Examples | Description |
|---|---|---|
| `keyword` | `make`, `function`, `return` | Language reserved keywords |
| `name` | `int`, `var_name`, `fun_name`, `add` | Identifiers and type names |
| `operator` | `=` | Assignment operator |
| `colon` | `:` | Return type separator |
| `brace` | `{`, `}` | Function and block delimiters |
| `paren` | `(`, `)` | Opening and closing parentheses |
| `comma` | `,` | Argument and parameter separators |
| `semicolon` | `;` | Statement delimiters |
| `number` | `2`, `42`, `100` | Integer numeric literals |
| `string` | `"hello"`, `'world'` | Single or double-quoted string literals |

### Input Example

```javascript
"add(2, subtract(4, 2))"
```

### Output (Tokens Array)

```json
[
  { "type": "name", "value": "add", "start": 0, "end": 3, "line": 1, "column": 1 },
  { "type": "paren", "value": "(", "start": 3, "end": 4, "line": 1, "column": 4 },
  { "type": "number", "value": "2", "start": 4, "end": 5, "line": 1, "column": 5 },
  { "type": "comma", "value": ",", "start": 5, "end": 6, "line": 1, "column": 6 },
  { "type": "name", "value": "subtract", "start": 7, "end": 15, "line": 1, "column": 8 },
  { "type": "paren", "value": "(", "start": 15, "end": 16, "line": 1, "column": 16 },
  { "type": "number", "value": "4", "start": 16, "end": 17, "line": 1, "column": 17 },
  { "type": "comma", "value": ",", "start": 17, "end": 18, "line": 1, "column": 18 },
  { "type": "number", "value": "2", "start": 19, "end": 20, "line": 1, "column": 20 },
  { "type": "paren", "value": ")", "start": 20, "end": 21, "line": 1, "column": 21 },
  { "type": "paren", "value": ")", "start": 21, "end": 22, "line": 1, "column": 22 }
]
```

### What This Output Means

Each token object has:
- `type`: Category of the token (e.g. `'name'`, `'number'`, `'comma'`).
- `value`: The exact textual content of the token.
- `start` / `end`: Zero-indexed character slice in the original string.
- `line` / `column`: 1-indexed human-readable line and column coordinates.

### Why We Need It in This Format

Raw source code is just a flat sequence of characters (`'a'`, `'d'`, `'d'`, `'('`, `'2'`, etc.). Parsing raw characters directly would require handling spaces, tabs, multi-digit numbers, escape sequences, and quotes all at once in every parser rule. By converting characters into clean tokens, the parser can focus solely on grammar and syntax structure.

### How It Is Used by Later Parts

The token stream is passed directly into `parser(tokens)`. The parser steps sequentially through the array using a cursor index, inspecting `token.type` and `token.value` without worrying about formatting or whitespace.

---

## 2. Parser (Syntactic Analysis)

- **Files**: `src/parser/parser.js`, `src/parser/helper.js`
- **Role**: Validates the grammatical structure of the token stream according to language syntax rules and arranges tokens into an **Abstract Syntax Tree (AST)**.

### Input Example

The token array output by the Tokenizer.

### Output (Input AST)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "CallExpression",
      "name": "add",
      "params": [
        {
          "type": "NumberLiteral",
          "value": "2"
        },
        {
          "type": "CallExpression",
          "name": "subtract",
          "params": [
            {
              "type": "NumberLiteral",
              "value": "4"
            },
            {
              "type": "NumberLiteral",
              "value": "2"
            }
          ]
        }
      ]
    }
  ]
}
```

### What This Output Means

- `Program`: The root node representing the entire source file. Its `body` contains an array of top-level expressions or statements.
- `CallExpression`: Represents a function invocation. It records the function `name` (`"add"`) and a nested array of arguments in `params`.
- `NumberLiteral`: Represents a raw numeric constant (`"2"`).
- `StringLiteral`: Represents a string constant.
- `Identifier`: Represents a standalone variable name.

Notice how the linear sequence of tokens is now structured hierarchically: `subtract(4, 2)` is placed as the second child in the `params` of `add`.

### Why We Need It in This Format

A flat list cannot represent nesting or precedence. An AST models the real relationship between operations: `subtract(4, 2)` must be evaluated to supply the argument to `add`.

### How It Is Used by Later Parts

The AST is given to `transformer(ast)`, which walks through each node to produce the target language representation.

---

## 3. Traverser (AST Walker)

- **File**: `src/traverser/index.js`
- **Role**: Provides a generic recursive Depth-First Search (DFS) tree walker. It visits every node in the AST and triggers user-defined lifecycle hooks (`enter` and `exit`) on a **visitor** object.

### Traversal Flow

For each node:
1. Calls `visitor[node.type].enter(node, parent)`.
2. Recursively traverses child nodes (e.g. `node.body`, `node.params`, `node.arguments`, or `node.expression`).
3. Calls `visitor[node.type].exit(node, parent)` after all children have been traversed.

```
Enter Program
  Enter CallExpression (add)
    Enter NumberLiteral (2)
    Exit NumberLiteral (2)
    Enter CallExpression (subtract)
      Enter NumberLiteral (4)
      Exit NumberLiteral (4)
      Enter NumberLiteral (2)
      Exit NumberLiteral (2)
    Exit CallExpression (subtract)
  Exit CallExpression (add)
Exit Program
```

### Why We Need It

Separating the traversal mechanics from the transformation logic adheres to the Single Responsibility Principle. The traverser knows *how to walk the tree*, while the visitor knows *what to do at each node*.

---

## 4. Visitor (Transformation Actions)

- **Files**: `src/visitor/index.js`, `src/visitor/helper.js`
- **Role**: Defines the concrete operations to execute whenever a node of a specific type is entered or exited during tree traversal.

### The Context Stack Mechanism

When transforming nested trees, an inner node must be inserted into the argument list of its immediate parent. The visitor accomplishes this with a `contextStack`:

1. When starting, `contextStack = [newAst.body]`. The top of the stack points to the program body.
2. Entering `CallExpression (add)`:
   - Create `{ type: 'CallExpression', callee: { type: 'Identifier', name: 'add' }, arguments: [] }`.
   - Wrap it in `ExpressionStatement` if it is at top-level.
   - Push the expression to the current stack level (`newAst.body`).
   - Push `expression.arguments` onto `contextStack`. Now any child node will be placed directly into `add.arguments`!
3. Entering child `NumberLiteral (2)`:
   - Pushes `{ type: 'NumberLiteral', value: '2' }` to the top of the stack (`add.arguments`).
4. Entering nested `CallExpression (subtract)`:
   - Pushes `subtract` to `add.arguments`.
   - Pushes `subtract.arguments` onto `contextStack`.
5. Exiting `CallExpression (subtract)`:
   - Pops `subtract.arguments` off `contextStack`.
6. Exiting `CallExpression (add)`:
   - Pops `add.arguments` off `contextStack`.

### Why We Need It

Without the context stack, transforming a nested tree would require manual index tracking or complex lookaheads. The visitor pattern with context stacking automatically handles arbitrary levels of nesting.

---

## 5. Transformer (AST-to-AST Conversion)

- **Files**: `src/transformer/index.js`, `src/transformer/helper.js`
- **Role**: Converts the source language's AST into the target language's AST (ESTree format for JavaScript).

### Input AST vs. Target AST Differences

| Feature | Input AST | Target JavaScript AST |
|---|---|---|
| Function name | `node.name = "add"` | `node.callee = { type: 'Identifier', name: 'add' }` |
| Arguments list | `node.params = [...]` | `node.arguments = [...]` |
| Statement wrapper | Direct `CallExpression` | Wrapped in `ExpressionStatement` (`...;`) |

### Output (Target AST)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "CallExpression",
        "callee": {
          "type": "Identifier",
          "name": "add"
        },
        "arguments": [
          {
            "type": "NumberLiteral",
            "value": "2"
          },
          {
            "type": "CallExpression",
            "callee": {
              "type": "Identifier",
              "name": "subtract"
            },
            "arguments": [
              {
                "type": "NumberLiteral",
                "value": "4"
              },
              {
                "type": "NumberLiteral",
                "value": "2"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

### Why We Need It in This Format

JavaScript syntax distinguishes between *expressions* (which produce a value) and *statements* (which execute an action and end with a semicolon). The target AST makes this explicit by wrapping top-level calls inside an `ExpressionStatement`, while inner nested calls remain pure `CallExpression`s.

### How It Is Used by Later Parts

The Target AST is passed directly into `codeGenerator(targetAst)`.

---

## 6. Code Generator (Code Emission)

- **File**: `src/generator/index.js`
- **Role**: Recursively walks the Target AST and concatenates it into a string of executable code in the target language.

### Rules Implemented

- `Program`: Maps each child through `codeGenerator` and joins them with newlines (`\n`).
- `ExpressionStatement`: Appends a semicolon `;` to the generated expression.
- `CallExpression`: Generates `callee(arg1, arg2, ...)`.
- `Identifier`: Returns the identifier name.
- `NumberLiteral`: Returns the string numeric value.
- `StringLiteral`: Returns a JSON-quoted string (`"value"`).

### Input Example

The Target AST produced by the Transformer.

### Output (String)

```javascript
add(2, subtract(4, 2));
```

### Why We Need It

Compilers ultimately produce executable code or binaries. The code generator is the final link in the chain that turns structured tree data back into valid, readable syntax.

---

## Centralized Error Handling

- **File**: `src/errors/index.js`
- **Role**: All errors across the entire pipeline (Tokenizer, Parser, Traverser, Generator) are funneled through a centralized error module.

### Features

1. **Custom Error Classes**:
   - `CompilerSyntaxError` (extends standard `SyntaxError`)
   - `CompilerTypeError` (extends standard `TypeError`)
2. **Detailed Location Metadata**:
   - Every error includes `line`, `column`, `token index`, and token `type`/`value`.
3. **Visual Code Frames**:
   - The error output renders the offending line of code alongside a caret (`^`) pointing directly to the exact column where the error occurred.

### Error Examples

#### 1. Missing Comma in Argument List (`add(2 3)`)
```
SyntaxError: Syntax Error: Expected ',' or ')' after argument, but got number at token index 3 (type: number, value: "3") (line 1, col 7)

  1 | add(2 3)
    |       ^
```

#### 2. Unknown Character (`add(@, 2)`)
```
TypeError: Type Error: Unknown character: @ at line 1, col 5

  1 | add(@, 2)
    |     ^
```

#### 3. Unterminated String (`print("hello)`)
```
SyntaxError: Syntax Error: Unterminated string literal at line 1, col 7

  1 | print("hello)
    |       ^
```

#### 4. Unclosed Parenthesis (`add(2, 3`)
```
SyntaxError: Syntax Error: Expected closing parenthesis for function call at token index 5 (line 1, col 9)

  1 | add(2, 3
    |         ^
```

---

## Complete End-to-End Walkthrough

Let's trace:

```javascript
import { compiler } from './src/index.js';

const output = compiler('add(2, subtract(4, 2))');
console.log(output);
```

### Step 1: `tokenizer('add(2, subtract(4, 2))')`
Extracts tokens:
`name("add")` → `paren("(")` → `number("2")` → `comma(",")` → `name("subtract")` → `paren("(")` → `number("4")` → `comma(",")` → `number("2")` → `paren(")")` → `paren(")")`.

### Step 2: `parser(tokens)`
Constructs input AST:
```
Program
 └─ CallExpression (name: 'add')
     ├─ NumberLiteral ('2')
     └─ CallExpression (name: 'subtract')
         ├─ NumberLiteral ('4')
         └─ NumberLiteral ('2')
```

### Step 3: `transformer(ast)`
Uses `traverser` and `createVisitor` to map input AST to Target AST:
```
Program
 └─ ExpressionStatement
     └─ CallExpression (callee: Identifier 'add')
         ├─ NumberLiteral ('2')
         └─ CallExpression (callee: Identifier 'subtract')
             ├─ NumberLiteral ('4')
             └─ NumberLiteral ('2')
```

### Step 4: `codeGenerator(targetAst)`
Recursively formats each node:
1. `subtract(4, 2)`
2. `add(2, subtract(4, 2))`
3. `add(2, subtract(4, 2));`

---

## Usage and Testing

### CLI Runner (`cli.js`)

Compile and execute any MyLang source file (`.my`, `.mylang`, etc.) directly from the terminal:

```bash
# 1. Compile source file to an executable .js file:
node cli.js example.my

# 2. Run the generated executable file:
node example.js

# 3. Or compile and run directly in a single command:
node cli.js example.my --run

# 4. Custom output path:
node cli.js example.my -o dist/app.js --run
```

### Run Main Demonstration
```bash
node test/main.js
```
**Input in `test/main.js`:**
```javascript
make int var_name = 10;

make function fun_name(int arg1, int arg2):int {
  make int sum = add(arg1, arg2);
  return multiply(sum, var_name);
}

make int result = fun_name(2, 3);
print("normal string" + any_declared_var + "other string");
```
**Output:**
```javascript
let var_name = 10;
function fun_name(arg1, arg2) {
  let sum = add(arg1, arg2);
  return multiply(sum, var_name);
}
let result = fun_name(2, 3);
console.log("normal string" + any_declared_var + "other string");
```

### Run Test Suite
```bash
node test/compiler.test.js
```
**Output:**
```
✓ Passed: Standard nested call expression
✓ Passed: Compact nested call expression without spaces
✓ Passed: Multiple statements with semicolons
✓ Passed: Multiple statements without semicolons
✓ Passed: Deep nesting
✓ Passed: Strings with spaces
✓ Passed: Function call with no arguments
✓ Passed: Function call with identifier argument
✓ Passed: Function call with trailing comma
✓ Passed: Top-level number literal
✓ Passed: Top-level string literal
✓ Passed: Variable declaration with integer literal
✓ Passed: Variable declaration with string literal
✓ Passed: Variable declaration with function call
✓ Passed: Function declaration with empty body
✓ Passed: Function declaration with body and return
✓ Passed: Full program: function declaration and function call
✓ Passed: Print with string and variable concatenation
✓ Passed: Print with single string literal
✓ Passed: Print with numeric binary addition

All 20 compiler tests passed!
✓ Passed error case: Unknown character in tokenizer
✓ Passed error case: Unterminated string in tokenizer
✓ Passed error case: Missing function name
✓ Passed error case: Unclosed parenthesis
✓ Passed error case: Unexpected token at program level
✓ Passed error case: Missing comma between arguments
✓ Passed error case: Missing variable type in make declaration
✓ Passed error case: Missing '=' in variable declaration
✓ Passed error case: Missing function name in make function
✓ Passed error case: Missing ':' in function declaration
✓ Passed error case: Unclosed '{' in function declaration

All 11 error tests passed!
```
