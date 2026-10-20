import { compiler } from "../src/index.js";
import assert from "node:assert";

const tests = [
    {
        name: "Standard nested call expression",
        input: "add(2, subtract(4, 2))",
        expected: "add(2, subtract(4, 2));"
    },
    {
        name: "Compact nested call expression without spaces",
        input: "add(2,subtract(4,2))",
        expected: "add(2, subtract(4, 2));"
    },
    {
        name: "Multiple statements with semicolons",
        input: "add(2, 3); subtract(4, 1);",
        expected: "add(2, 3);\nsubtract(4, 1);"
    },
    {
        name: "Multiple statements without semicolons",
        input: "add(2, 3) subtract(4, 1)",
        expected: "add(2, 3);\nsubtract(4, 1);"
    },
    {
        name: "Deep nesting",
        input: "add(multiply(2, divide(8, 4)), 3)",
        expected: "add(multiply(2, divide(8, 4)), 3);"
    },
    {
        name: "Strings with spaces",
        input: 'concat("hello", "world")',
        expected: 'concat("hello", "world");'
    },
    {
        name: "Function call with no arguments",
        input: "init()",
        expected: "init();"
    },
    {
        name: "Function call with identifier argument",
        input: "add(2, x)",
        expected: "add(2, x);"
    },
    {
        name: "Function call with trailing comma",
        input: "add(1, 2,)",
        expected: "add(1, 2);"
    },
    {
        name: "Top-level number literal",
        input: "42",
        expected: "42"
    },
    {
        name: "Top-level string literal",
        input: '"hello"',
        expected: '"hello"'
    },
    {
        name: "Variable declaration with integer literal",
        input: "make int var_name = 10;",
        expected: "let var_name = 10;"
    },
    {
        name: "Variable declaration with string literal",
        input: 'make string msg = "hello";',
        expected: 'let msg = "hello";'
    },
    {
        name: "Variable declaration with function call",
        input: "make int total = add(2, 3);",
        expected: "let total = add(2, 3);"
    },
    {
        name: "Function declaration with empty body",
        input: "make function fun_name(int arg1 , int arg2):return_type{}",
        expected: "function fun_name(arg1, arg2) {\n}"
    },
    {
        name: "Function declaration with body and return",
        input: "make function addTwo(int a, int b):int { return add(a, b); }",
        expected: "function addTwo(a, b) {\n  return add(a, b);\n}"
    },
    {
        name: "Full program: function declaration and function call",
        input: "make function double(int n):int { return add(n, n); }\nmake int res = double(5);",
        expected: "function double(n) {\n  return add(n, n);\n}\nlet res = double(5);"
    },
    {
        name: "Print with string and variable concatenation",
        input: 'print("normal string" + any_declared_var + "other string");',
        expected: 'console.log("normal string" + any_declared_var + "other string");'
    },
    {
        name: "Print with single string literal",
        input: 'print("hello world");',
        expected: 'console.log("hello world");'
    },
    {
        name: "Print with numeric binary addition",
        input: "print(10 + 20);",
        expected: "console.log(10 + 20);"
    }
];

let passed = 0;
for (const t of tests) {
    const actual = compiler(t.input);
    assert.strictEqual(actual, t.expected, `Failed: ${t.name}`);
    console.log(`✓ Passed: ${t.name}`);
    passed++;
}

console.log(`\nAll ${passed} compiler tests passed!`);

const errorTests = [
    {
        name: "Unknown character in tokenizer",
        input: "add(@, 2)",
        errorType: TypeError
    },
    {
        name: "Unterminated string in tokenizer",
        input: 'print("hello)',
        errorType: SyntaxError
    },
    {
        name: "Missing function name",
        input: "()",
        errorType: SyntaxError
    },
    {
        name: "Unclosed parenthesis",
        input: "add(2, 3",
        errorType: SyntaxError
    },
    {
        name: "Unexpected token at program level",
        input: "add(2, 3))",
        errorType: SyntaxError
    },
    {
        name: "Missing comma between arguments",
        input: "add(2 3)",
        errorType: SyntaxError
    },
    {
        name: "Missing variable type in make declaration",
        input: "make = 10;",
        errorType: SyntaxError
    },
    {
        name: "Missing '=' in variable declaration",
        input: "make int x 10;",
        errorType: SyntaxError
    },
    {
        name: "Missing function name in make function",
        input: "make function (int a):void {}",
        errorType: SyntaxError
    },
    {
        name: "Missing ':' in function declaration",
        input: "make function foo(int a) void {}",
        errorType: SyntaxError
    },
    {
        name: "Unclosed '{' in function declaration",
        input: "make function foo(int a):void {",
        errorType: SyntaxError
    }
];

let errorPassed = 0;
for (const t of errorTests) {
    assert.throws(
        () => compiler(t.input),
        (err) => err instanceof t.errorType,
        `Expected ${t.name} to throw ${t.errorType.name}`
    );
    console.log(`✓ Passed error case: ${t.name}`);
    errorPassed++;
}

console.log(`\nAll ${errorPassed} error tests passed!`);

