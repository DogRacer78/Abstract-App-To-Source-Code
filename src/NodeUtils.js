import * as acorn from "acorn";

/**
 * Traverses through an AST using a depth first search, vising all nodes
 * @param {object} tree The AST to traverse
 * @param {function} callback Callback to run when visiting a node
 */
function visit(tree, callback){
    function _visit(node, parent, key){
    // call this function when a node is traversed
        if (callback(node, parent, key))
            return;

        const keys = Object.keys(node);
        //console.log(keys);

        // loop through all the nodes in this branch
        for (let i = 0; i < keys.length; i++){
            const child = node[keys[i]];

            // if any of the properties of a node are an array loop through the array
            if (Array.isArray(child)){
                for (let j = 0; j < child.length; j++){
                    _visit(child[j], node, keys[i]);
                }
            }
            // if any of the properties of a node is a node, go down that branch
            else if (isNode(child)){
                _visit(child, node, keys[i]);
            }
        }
    }
    _visit(tree, null);
}

/**
 * Checks if an object is an object
 * @param {object} node Node to check
 * @returns true if the object is a node
 */
function isNode(node){
    return typeof node === "object" && node !== null;
}

/**
 * Adds a node to the end of the AST
 * @param {object} tree The AST to add the node to the end of
 * @param {object} node Node to add to the end
 */
function addNodeToEnd(tree, node){
    tree.body.push(node);
}

/**
 * 
 * @param {object} tree The AST to add the nodes to the end of
 * @param {Array} nodes Array of nodes to add to the end
 */
function addMultipleNodesToEnd(tree, nodes){
    for (let i = 0; i < nodes.length; i++){
        addNodeToEnd(tree, nodes[i]);
    }
}

/**
 * String of code to parse into an AST
 * @param {String} codeString
 * @returns AST of the supplied code string
 */
function codeToAST(codeString){
    let code = acorn.parse(codeString, {ecmaVersion : 2022});
    return code.body;
}

/**
 * Adds a node to specified index
 * @param {Object} tree Tree to insert into
 * @param {number} index Index to insert into
 * @param {Object} node Data to add to the array
 */
function insertAtIndex(tree, index, node){
    if (index < 0 || index >= tree.body.length){
        return;
    }

    tree.body.splice(index, 0, node);
}

export {visit, addNodeToEnd, addMultipleNodesToEnd, codeToAST, insertAtIndex};