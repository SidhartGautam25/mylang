import { compiler } from "../src/index.js";


const source = `make int var_name = 10;

make function fun_name(int arg1, int arg2):int {
  make int sum = add(arg1, arg2);
  return multiply(sum, var_name);
}

make int result = fun_name(2, 3);
print("normal string" + any_declared_var + "other string");`;

const output = compiler(source);

console.log(output);