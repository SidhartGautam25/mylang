import { compiler } from "../src/index.js";


const source = 'add(2, subtract(4, 2))';

const output = compiler(source);

console.log(output);