/**
 * Adds a comment to the end of an AST given a string
 * @param {object} tree Tree to add the comment node to
 * @param {String} comment Text to add
 */
function addCommentsToEnd(tree, comment){
    tree.body.push(createComment(comment));
}

/**
 * Creates a comment node given a supplied string
 * @param {String} comment Text to use as a commnt
 * @returns Comment node
 */
function createComment(comment){
    // creates comment as an expression statement, will then do a replace on the comment

    // add the comment declarators
    let code = `/*${comment}*/`;
    console.log(code);
    console.log(comment);
    // create a custom expression node that contains an identifier
    // set the identifier node to contain the comment
    // as identifers don't use strings it will just print it as is including the /* and */
    let AST = {type : "ExpressionStatement", expression : {type : "Identifier", name :  code}}
    return AST;
}

export {addCommentsToEnd, createComment};