import { traverser } from '../traverser/index.js';
import { createVisitor } from '../visitor/index.js';


export const transformer=(ast)=> {
    const newAst = {
        type: 'Program',
        body: []
    };
    const contextStack = [newAst.body];
    const VISITOR = createVisitor(contextStack);
    traverser(ast , VISITOR , contextStack);
    return newAst;

}