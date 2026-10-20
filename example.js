// --- MyLang Standard Runtime ---
const add = (a, b) => a + b;
const subtract = (a, b) => a - b;
const multiply = (a, b) => a * b;
const divide = (a, b) => a / b;
const concat = (...args) => args.join('');
// -------------------------------

let var_name = 10;
function sum(a, b) {
  return a + b;
}
function fun_name(arg1, arg2) {
  let total = sum(arg1, arg2);
  return total;
}
let result = fun_name(2, 3);
console.log("normal string" + " + " + "other string");
console.log("Calculated result of fun_name(2, 3): " + result);
