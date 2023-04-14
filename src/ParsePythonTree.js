import { visit } from "./NodeUtils.js";
import { codeToAST } from "./NodeUtils.js";
import { createComment } from "./Comments.js";

/**
 * Parses a python files AST and extracts the neccasary parts
 * @param {Object} tree tree of a python file
 * @returns Object containing the methods and all other code
 */
function parsePythonTree(tree){
    let code = {
        nonKeyCode : [],
        start_up : [],
        events : [],
        output : []
    };

    // find comment nodes and manipulate
    manipulateComments(tree);

    // find getValue nodes and manipulate
    manipulateGetValue(tree);

    // find setOutput nodes and manipulate
    manipulateSetOutput(tree);
    

    // look for events
    for (let i = 0; i < tree.body.length; i++){
        if (checkForStartUp(tree.body[i])){
            if (code.start_up.length !== 0)
                throw new Error("Multiple start_up nodes found\nPlease ensure you only have one start_up method");
            code.start_up = constructStartUp();
            code.nonKeyCode.push(tree.body[i]);
        }
        else if (checkEvent(tree.body[i])){
            console.log("in event");
            let eventCode = constructEvent(getEvent(tree.body[i]));
            //console.log(eventCode);
            code.events.push(eventCode);
            code.nonKeyCode.push(tree.body[i]);
            console.log(code.events);
        }
        else{
            code.nonKeyCode.push(tree.body[i]);
        }
    }

    return code;
}

/**
 * Locates and manipulates the any getValue nodes found
 * @param {object} tree Tree to manipulate
 */
function manipulateGetValue(tree){
    visit(tree, (node, parent, key) => {
        if (node.type === "CallExpression"){
            if (node.callee.type === "Identifier"){
                if (/^[^_]*_[^_]*$/.test(node.callee.name)){
                    let data = node.callee.name.split("_");
                    if (data[0] === "getValue"){
                        // this is a good function now construct the function call
                        let code = `document.getElementById('${data[1]}').value`;
                        let AST = codeToAST(code);
                        console.log("DOCUEMENT");
                        console.log(JSON.stringify(AST[0], null, 3));
                        console.log("NODE");
                        console.log(JSON.stringify(node, null, 3));
                        delete node.callee;
                        delete node.arguments;
                        delete node.optional;

                        const keys = Object.keys(AST[0].expression);
                        console.log(keys);
                        for (let i = 0; i < keys.length; i++){
                            node[keys[i]] = AST[0].expression[keys[i]];
                        }
                        //node.object = AST[0].expression.object;
                        //node.type = AST[0].expression.type;
                        //node.
                        //node.type = AST[0].type;
                        console.log("NODE AFTER");
                        console.log(JSON.stringify(node, null, 3));
                        //delete node.start;
                        //delete node.end;
                    }
                }
            }
        }
    });
}

/**
 * function to visit all nodes in the tree and locate the comment nodes
 * @param {object} tree Tree to manipulate
 */
function manipulateComments(tree){
    console.log("GETTING COMMENTS");
    visit(tree, (node, parent, key) => {
        if (node.type === "ExpressionStatement"){
            if (node.expression.type === "CallExpression"){
                if (node.expression.callee.type === "Identifier"){
                    if (node.expression.callee.name === "__COMMENT__"){
                        console.log("FOUND COMMENT");
                        // get the call expression
                        // get the list of args
                        let args = node.expression.arguments;

                        // if the list of args is not correct throw an error
                        if (args.length !== 1){
                            throw new Error("Invalid Syntax for a comment block\nPlease check it follows the format __COMMENT__(comment)")
                        }
                        else{
                            if (args[0].type !== "Literal"){
                                throw new Error("Invalid Syntax for a comment block\nMust contain a single string with no string concatanations");
                            }
                            let comment = createComment(args[0].value);
                            node.expression = comment.expression;
                        }
                        return;
                    }
                }
            }
        }
    });
}

// *************************************** event methods ***************************************

/**
 * Checks if a function declaration relates to an event
 * @param {object} node Node to check
 * @returns An object containing the event and the id of the element or null if it is not an event
 */
function getEvent(node){
    let eventArray = node.id.name.split("_");
    console.log(eventArray);
    // for now just add the strings as they are may need to add some validation to this
    // TODO
    let event = {funcName : node.id.name, eventType : eventArray[1], elementId : eventArray[2]};
    return event;
}

/**
 * Checks if a node is an event node
 * @param {object} node Node to check
 * @returns true if is an event, false otherwise
 */
function checkEvent(node){
    let eventFormat = /^[^_]{1,}_[^_]{1,}_[^_]{1,}$/;

    if (node.type === "FunctionDeclaration"){
        if (node.id.type === "Identifier"){
            // test the function name using regex to see if it matches the event format
            if (eventFormat.test(node.id.name)){
                return true;
            }
        }
    }

    return false;
}

/**
 * Creates a node for the given event data
 * @param {object} eventData Data for the event
 * @returns The event node
 */
function constructEvent(eventData){
    let eventStructure = `document.getElementById('${eventData.elementId}\').addEventListener('${eventData.eventType}', ${eventData.funcName})`;
    console.log(eventStructure);
    let AST = codeToAST(eventStructure);
    return AST[0];
}


// *************************************** setOutput methods ***************************************

/**
 * Finds and manipulates all setOutput nodes
 * @param {object} tree Tree to manipulate
 */
function manipulateSetOutput(tree){
    console.log("GETTING OUTPUT");
    visit(tree, (node, parent, key) =>{
        let check = checkSetOutput(node);
        if (check !== null){
            console.log("IS AN OUTPUT");
            let code = constructSetOutput(check);
            console.log("CODE IS:");
            console.log(code);
            node.type = code.type;
            node.expression = code.expression;
        }
    });
}

/**
 * Checks if a node is a setOutput node
 * @param {object} node Node to check
 * @returns Object containing the data for a setOutput node or null if it not a node
 */
function checkSetOutput(node){
    let outPutData = null;
    let check = /^setOutput_[^_]*$/;
    // check if the node is an expression
    if (node.type === "ExpressionStatement"){
        if (node.expression.type === "CallExpression"){
            if (node.expression.callee.type === "Identifier"){
                if (check.test(node.expression.callee.name)){
                    // test the name of the method against the above regex
                    let callData = node.expression.callee.name.split("_");
                    console.log(callData[1]);
                    // splits based on the _ and the second element is the id
    
                    // check if the args contain only one thing
                    let args = node.expression.arguments;
                    console.log(args[0]);
                    if (args.length === 0)
                        throw new Error("setOutput_id must contain one argument of data");
    
                    // now create the node
                    outPutData = 
                    {
                        id : callData[1],
                        data : args[0]
                    }
                }
            }
        }
    }
    return outPutData;
}

/**
 * Creates a node for a setOutput node
 * @param {object} outputData Data to construct the node from
 * @returns A node created with the supplied data
 */
function constructSetOutput(outputData){
    let node = 
    {
        type: "ExpressionStatement",
        expression: {
          type: "AssignmentExpression",
          operator: "=",
          left: {
            type: "MemberExpression",
            object: {
              type: "CallExpression",
              callee: {
                type: "MemberExpression",
                object: {
                  type: "Identifier",
                  name: "document"
                },
                property: {
                  type: "Identifier",
                  name: "getElementById"
                },
                computed: false,
                optional: false
              },
              arguments: [
                {
                  type: "Literal",
                  value: outputData.id,
                  raw: `'${outputData.id}'`
                }
              ],
              optional: false
            },
            property: {
              type: "Identifier",
              name: "innerText"
            },
            computed: false,
            optional: false
          },
          right: outputData.data
        }
    }
    console.log(node);
    return node;
}

/**
 * Checks if a node is the node for the start_up function
 * @param {object} node Node to check if is a start_up function
 * @returns true if it is a start_up function, false if it is not
 */
function checkForStartUp(node){
    if (node.type === "FunctionDeclaration"){
        if (node.id.type === "Identifier"){
            if (node.id.name === "start_up"){
                return true;
            }
        }
    }
    return false;
}



/**
 * Locates and inserts into the whenReady function definition
 * @param {object} tree node to insert into the whenReady function
 * @param {Array} codeToAdd Array of code to add
 */
function constructStartUp(){
    let onLoadCode = `window.addEventListener('load', start_up);`;
    let AST = codeToAST(onLoadCode);
    return AST;
}

export {parsePythonTree};