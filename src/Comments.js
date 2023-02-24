// adds comments to the end of the tree
// creates comment as an expression statement, will then do a replace on the comment
function addCommentsToEnd(tree, comment){
    tree.body.push(createComment(comment));
}

// creates the comment as needed and returns the correct expression statement
function createComment(comment){
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