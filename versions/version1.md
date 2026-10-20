# MyLang - Version 1 Specification & Version 2 Roadmap

This document outlines the architecture, features, capabilities, and limitations of **Version 1 (V1)** of MyLang, followed by the complete design and implementation roadmap for **Version 2 (V2)**.

---

## Part 1: What We Have in Version 1 (V1)

Version 1 transitions the language from a Lisp-style S-expression syntax (e.g. `(add 2 (subtract 4 2))`) to a modern C/JavaScript-style expression syntax (e.g. `add(2, subtract(4, 2))`), backed by a complete end-to-end compiler pipeline and centralized error diagnostics.

### 1. V1 Pipeline Architecture

```
Source Code ──> Tokenizer ──> Parser ──> Traverser + Visitor ──> Transformer ──> Code Generator
      │               │           │                                                      │
      └───────────────┴───────────┴───> Centralized Error Handler <──────────────────────┘
```

### 2. Implemented Features in V1

#### A. C/JavaScript-Style Call Expression Syntax
- **Function invocations**: Function name followed by parenthesis, comma-separated arguments, and closing parenthesis:
  ```javascript
  add(2, subtract(4, 2))
  ```
- **Zero-argument calls**:
  ```javascript
  init()
  ```
- **Nested calls**: Arbitrary levels of nesting:
  ```javascript
  add(multiply(2, divide(8, 4)), 3)
  ```
- **Trailing comma support**:
  ```javascript
  add(1, 2,)
  ```
- **Whitespace flexibility**: Works with or without spaces around commas and parentheses:
  ```javascript
  add(2,subtract(4,2))
  ```

#### B. Statement & Multi-Statement Handling
- **Optional Semicolons**: Expressions can be written with or without trailing semicolons:
  ```javascript
  add(2, 3);
  subtract(4, 1);
  ```
- **Multiple statements on single or multiple lines**:
  ```javascript
  add(2, 3) subtract(4, 1)
  ```
  Both output properly formatted, separated JavaScript statements.

#### C. Literals & Identifiers
- **Numeric literals**: Integers such as `42`, `100`.
- **String literals**: Supported in both double quotes (`"hello"`) and single quotes (`'world'`), with backslash escape sequence handling (`\"`, `\\`).
- **Identifiers**: Identifiers starting with `[a-zA-Z_]` followed by `[a-zA-Z0-9_]`, allowing function names and variables (e.g. `add(2, x)`).

#### D. Pipeline Components

1. **Tokenizer (`src/tokenizer.js`)**:
   - Converts raw input text into structured tokens: `name`, `paren`, `comma`, `semicolon`, `number`, `string`.
   - Tracks precise source location metadata: `line`, `column`, `start`, and `end` on every token.
   - Preserves source reference for downstream error reporting.

2. **Parser (`src/parser/parser.js`, `src/parser/helper.js`)**:
   - Implements a recursive descent parser.
   - Builds an Input AST consisting of `Program`, `CallExpression`, `NumberLiteral`, `StringLiteral`, and `Identifier`.
   - Strict syntax validation for argument delimiters, matching parentheses, and token placements.

3. **Traverser (`src/traverser/index.js`)**:
   - Depth-First Search (DFS) recursive AST traversal.
   - Provides `enter` and `exit` lifecycle hooks for all node types.

4. **Visitor (`src/visitor/index.js`, `src/visitor/helper.js`)**:
   - Utilizes a `contextStack` to maintain nesting context during transformation.
   - Pushes child expressions into the `arguments` array of their corresponding parent `CallExpression`.

5. **Transformer (`src/transformer/index.js`)**:
   - Converts Input AST into Target JavaScript AST (ESTree-style).
   - Wraps top-level expressions in `ExpressionStatement` nodes while preserving nested expressions as raw `CallExpression` nodes.
   - Converts `name` into `callee: { type: 'Identifier', name }` and `params` into `arguments`.

6. **Code Generator (`src/generator/index.js`)**:
   - Recursively formats the Target AST into clean, standard JavaScript code with semicolons and indentation.

7. **Centralized Error Handling (`src/errors/index.js`)**:
   - Dedicated `CompilerSyntaxError` and `CompilerTypeError` classes.
   - Visual code frames showing the offending code line with a caret (`^`) pointing to the exact column:
     ```
     Syntax Error: Expected ',' or ')' after argument, but got number at token index 3 (type: number, value: "3") (line 1, col 7)

       1 | add(2 3)
         |       ^
     ```

### 3. Current Limitations of Version 1

- **Expressions Only**: Can only parse and execute expressions and top-level literals.
- **No Variable Declarations**: Cannot declare variables (`let`, `const`, `var`).
- **No Custom Function Declarations**: Only calls predefined or built-in function names; users cannot define their own functions with parameters and return values.
- **No Control Flow**: No `if/else` branching or conditional logic.
- **No Loops**: No iteration constructs (`while`, `for`).
- **No Infix Operators**: Arithmetic and comparisons must be written as prefix function calls (`add(a, b)` instead of `a + b`).

---

## Part 2: What We Are Going to Have in Version 2 (V2)

Version 2 will transform MyLang from an expression language into an imperative, structured programming language with state, control flow, functions, and loops.

### 1. Key Features for Version 2

```
┌─────────────────────────────────────────────────────────────────┐
│                      Version 2 Feature Set                      │
├───────────────────────────────┬─────────────────────────────────┤
│ 1. Variable Declarations      │ let, const, var, assignment     │
│ 2. Function Declarations      │ function name(params) { ... }   │
│ 3. Block Statements           │ { statement1; statement2; }     │
│ 4. Return Statements          │ return expression;              │
│ 5. Loops                      │ while (...) { ... }, for (...)  │
│ 6. Infix Binary Expressions   │ +, -, *, /, %, <, >, ==, !=     │
│ 7. Scoping & Symbol Table     │ Variable lookups, scope frames  │
└───────────────────────────────┴─────────────────────────────────┘
```

---

### 2. Detailed V2 Features & Syntax Specifications

#### Feature 1: Variable Declarations & Assignments

Users will be able to store state in variables with `let`, `const`, and reassign mutable variables.

##### Syntax Example
```javascript
let count = 10;
const greeting = "hello";
let total = add(count, 5);
count = add(count, 1);
```

##### New AST Nodes
```json
{
  "type": "VariableDeclaration",
  "kind": "let",
  "declarations": [
    {
      "type": "VariableDeclarator",
      "id": { "type": "Identifier", "name": "count" },
      "init": { "type": "NumberLiteral", "value": "10" }
    }
  ]
}
```
And for reassignment:
```json
{
  "type": "AssignmentExpression",
  "operator": "=",
  "left": { "type": "Identifier", "name": "count" },
  "right": {
    "type": "CallExpression",
    "callee": { "type": "Identifier", "name": "add" },
    "arguments": [
      { "type": "Identifier", "name": "count" },
      { "type": "NumberLiteral", "value": "1" }
    ]
  }
}
```

---

#### Feature 2: Function Declarations & Return Statements

Users will be able to define custom reusable functions with named parameters and explicit return statements.

##### Syntax Example
```javascript
function calculateTotal(subtotal, taxRate) {
    let tax = multiply(subtotal, taxRate);
    return add(subtotal, tax);
}

let bill = calculateTotal(100, 0.08);
```

##### New AST Nodes
```json
{
  "type": "FunctionDeclaration",
  "id": { "type": "Identifier", "name": "calculateTotal" },
  "params": [
    { "type": "Identifier", "name": "subtotal" },
    { "type": "Identifier", "name": "taxRate" }
  ],
  "body": {
    "type": "BlockStatement",
    "body": [
      {
        "type": "VariableDeclaration",
        "kind": "let",
        "declarations": [...]
      },
      {
        "type": "ReturnStatement",
        "argument": {
          "type": "CallExpression",
          "name": "add",
          "params": [...]
        }
      }
    ]
  }
}
```

---

#### Feature 3: Loops (`while` and `for`)

Loops will allow repeating operations over collections or counter increments.

##### Syntax Examples

**`while` Loop**:
```javascript
let i = 0;
while (lessThan(i, 5)) {
    print(i);
    i = add(i, 1);
}
```

**`for` Loop**:
```javascript
for (let i = 0; lessThan(i, 10); i = add(i, 1)) {
    print(i);
}
```

##### New AST Nodes
```json
{
  "type": "WhileStatement",
  "test": {
    "type": "CallExpression",
    "name": "lessThan",
    "params": [
      { "type": "Identifier", "name": "i" },
      { "type": "NumberLiteral", "value": "5" }
    ]
  },
  "body": {
    "type": "BlockStatement",
    "body": [
      {
        "type": "ExpressionStatement",
        "expression": { "type": "CallExpression", "name": "print", "params": [...] }
      },
      {
        "type": "ExpressionStatement",
        "expression": { "type": "AssignmentExpression", ... }
      }
    ]
  }
}
```

---

#### Feature 4: Binary & Comparison Operators (Optional Infix Sugar)

In addition to function calls like `add(a, b)` and `lessThan(a, b)`, V2 can support infix operators:
```javascript
let result = (a + b) * c;
while (i < 5) { ... }
```

##### AST Node (`BinaryExpression`)
```json
{
  "type": "BinaryExpression",
  "operator": "+",
  "left": { "type": "Identifier", "name": "a" },
  "right": { "type": "Identifier", "name": "b" }
}
```

---

### 3. Architectural Updates Required Across Stages in V2

| Compiler Component | Changes Needed for V2 |
|---|---|
| **`src/tokenizer.js`** | • Recognize keywords (`let`, `const`, `var`, `function`, `return`, `while`, `for`, `if`, `else`)<br>• Recognize curly braces (`{`, `}`)<br>• Recognize operators (`=`, `+`, `-`, `*`, `/`, `<`, `>`, `==`, `!=`, `<=`, `>=`) |
| **`src/parser/`** | • Implement statement parsing: `parseStatement()`<br>• `parseVariableDeclaration()`<br>• `parseFunctionDeclaration()`<br>• `parseBlockStatement()`<br>• `parseReturnStatement()`<br>• `parseWhileStatement()` and `parseForStatement()`<br>• Operator precedence parsing for binary expressions |
| **`src/traverser/`** | • Add traversal branches for `BlockStatement`, `VariableDeclaration`, `VariableDeclarator`, `FunctionDeclaration`, `ReturnStatement`, `WhileStatement`, `ForStatement`, `BinaryExpression` |
| **`src/visitor/`** | • Support nested block scopes<br>• Manage context stacks for function bodies, loop bodies, and statement blocks |
| **`src/transformer/`** | • Lower high-level constructs or pass through to valid ESTree target nodes<br>• Transform scope and parameter bindings |
| **`src/generator/`** | • Indented block formatting (`{\n  ...\n}`)<br>• Variable statement generation (`let x = ...;`)<br>• Function declaration emission (`function name(...) { ... }`)<br>• Loop code emission (`while (...) { ... }`) |
| **`src/errors/`** | • Semantic error checks: duplicate variable declaration in same scope, reassigning `const`, return outside function, break outside loop |

---

### 4. Comparison Summary: V1 vs. V2

| Capability | Version 1 (Current) | Version 2 (Planned) |
|---|---|---|
| **Syntax Style** | C/JS Call Expressions | Full Imperative C/JS Language |
| **Call Expressions** | `fn(arg1, arg2)` | `fn(arg1, arg2)` |
| **Literals** | Numbers, Strings | Numbers, Strings, Booleans (`true`, `false`) |
| **Variables** | None | `let`, `const`, reassignment |
| **Functions** | Built-in / externally provided | User-defined `function foo(x) { return x; }` |
| **Statements** | Expression statements only | Variable, Function, Return, Block statements |
| **Control Flow** | None | `while` loops, `for` loops, `if/else` |
| **Scoping** | Global program scope only | Block scope, Function scope, Shadowing |
| **Error System** | Tokenizer & Parser syntax errors with code frames | Syntax errors + Semantic / Scope / Type checks |
