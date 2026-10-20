import { PARSER_UTILS } from "./helper.js";

export function parser(tokens){
    const cursor = { current: 0 };
    const source = tokens?.source || '';
    const ast = PARSER_UTILS.parseProgram(tokens, cursor, source);
    return ast;
}