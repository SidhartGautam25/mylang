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
        VariableDeclaration: {
            enter: (node, parent) => VISITOR_UTILS.VariableDeclaration.enter(node, parent, contextStack),
            exit: (node, parent) => VISITOR_UTILS.VariableDeclaration.exit(node, parent, contextStack)
        },
        FunctionDeclaration: {
            enter: (node, parent) => VISITOR_UTILS.FunctionDeclaration.enter(node, parent, contextStack),
            exit: (node, parent) => VISITOR_UTILS.FunctionDeclaration.exit(node, parent, contextStack)
        },
        ReturnStatement: {
            enter: (node, parent) => VISITOR_UTILS.ReturnStatement.enter(node, parent, contextStack),
            exit: (node, parent) => VISITOR_UTILS.ReturnStatement.exit(node, parent, contextStack)
        },
        BinaryExpression: {
            enter: (node, parent) => VISITOR_UTILS.BinaryExpression.enter(node, parent, contextStack),
            exit: (node, parent) => VISITOR_UTILS.BinaryExpression.exit(node, parent, contextStack)
        },
        
        // OR if your traverser uses a separate top-level key for exits:
        exitCallExpression: () => VISITOR_UTILS.exitCallExpression(contextStack)
    };
}