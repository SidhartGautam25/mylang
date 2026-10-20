import { VISITOR_UTILS } from "./helper.js";

export const createVisitor=(contextStack)=> {
    return {
        NumberLiteral: {
            enter: (node , parent) => VISITOR_UTILS.NumberLiteral.enter(node, parent , contextStack)
        },
        StringLiteral: {
            enter: (node , parent) => VISITOR_UTILS.StringLiteral.enter(node, parent , contextStack)
        },
        Identifier: {
            enter: (node, parent) => VISITOR_UTILS.Identifier.enter(node, parent, contextStack)
        },
        CallExpression: {
            enter: (node, parent) => VISITOR_UTILS.CallExpression.enter(node, parent, contextStack),
            exit: (node, parent) => VISITOR_UTILS.CallExpression.exit(node, parent, contextStack)
        },
        
        // OR if your traverser uses a separate top-level key for exits:
        exitCallExpression: () => VISITOR_UTILS.exitCallExpression(contextStack)
    };
}