import { tokenizer } from "./tokenizer.js";
import { parser } from "./parser/parser.js";
import { codeGenerator } from "./generator/index.js";
import { transformer } from "./transformer/index.js";



export const compiler = (input)=>{
    const tokens = tokenizer(input);
    const ast = parser(tokens);
    const targetAst = transformer(ast);
    const code = codeGenerator(targetAst);

    return code;
}