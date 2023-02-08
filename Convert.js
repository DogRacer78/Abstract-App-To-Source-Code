// takes in a main.js file, converts to a syntax tree, then appends the available functions to the main.js tree, then back to js

import fs from "fs";
import {toJs} from 'estree-util-to-js';
import exec from "child_process";
import * as acorn from "acorn";
import { PythonShell } from "python-shell";

/*
// read in the python file
var pythonFile = fs.readFileSync("./App.py", "utf-8")

// the python tree
var pythonTree = filbert.parse(pythonFile)
console.log(pythonTree.type)
*/

// the entry point of the program
function main(){
    var nameProject = process.argv[2];
    var typeAppToCreate = process.argv[3];

    //console.log(pathToProject)
    //console.log(typeAppToCreate)

    if (typeAppToCreate === "-electron"){
        createElectronApp(nameProject);
        updateElectronJS(nameProject);
    }
    else if (typeAppToCreate === "-uelectron"){
        updateElectronJS(nameProject);
    }
    else{
        console.error(typeAppToCreate + " not recognised as a project type");
    }

    
}


// will create an electron app by running the appropriate command
function createElectronApp(name){
    exec.execSync("./CreateElectron.sh " + "\"" + name + "\"", (err, stdout, stderr) => {
        if (err){
            console.log("ERROR")
            console.log(err.message);
            return;
        }

        if (stderr){
            console.log(stderr);
            return;
        }

        console.log(stdout.message)
    });

    // edit the json to contain the start script
    var packageJSON = JSON.parse(fs.readFileSync("./" + name + "/package.json", "utf-8"));
    console.log(packageJSON)
    packageJSON.scripts.start = "electron .";
    packageJSON.main = "main.js";
    fs.writeFileSync("./" + name + "/package.json", JSON.stringify(packageJSON, null, 4));

    // get the syntax tree of a typical main.js for electron
    var mainJSTree = JSON.parse(fs.readFileSync("./templates/mainJS.json", "utf-8"))
    var mainJs = toJs(mainJSTree)
    fs.writeFileSync("./" + name + "/main.js", mainJs.value)

    //copy the basic html file to the app dir
    var htmlFile = fs.readFileSync("./templates/index.html", "utf-8");
    fs.writeFileSync("./" + name + "/index.html", htmlFile);

}

// will take the current index.js file in a project and add a console.log to the start up method
function updateElectronJS(projectName){
    // first we need to call the python script and obtain the code
    PythonShell.run('./Tools/ConvertAppToJS.py', null, (err, results) =>{
        try{
            if (err) throw err;
        }
        catch (e){
            console.log(`\n********************************************************
Please enure you have the following:
Python
JavaScripthon
An App.py file created in your project directory
*******************************************************\n`);
            return;
        }
        

        console.log(results);
        let pythonApp = results.join('');

        // define all file variables
        let indexJSTree;
        let pythonAppTree;
        let pythonCodeParsed;
        let newIndexJS;

        try{
            // load the electron main.js template
            indexJSTree = JSON.parse(fs.readFileSync("./templates/blank.json", "utf-8"));
            // create the AST of the python code
            pythonAppTree = acorn.parse(pythonApp, {ecmaVersion : 2022});
            // parse the python AST
            pythonCodeParsed = parsePythonTree(pythonAppTree);
            // add the start_up method to the correct method within the index.js
            //addToWhenReady(indexJSTree, pythonCodeParsed.start_up);
            // add the other code to the index.js file
            addMultipleNodesToEnd(indexJSTree, pythonCodeParsed.nonKeyCode);
            addMultipleNodesToEnd(indexJSTree, pythonCodeParsed.events);

            console.log(JSON.stringify(indexJSTree, null, 3));

            // compile the modified AST back into JS
            newIndexJS = toJs(indexJSTree);
            // write back out to the index.js file
            fs.writeFileSync("./" + projectName + "/index.js", newIndexJS.value);
        }
        catch (e){
            console.error(e.message);
            console.error(e.name);
        }
    });
    
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
 * Parses a python files AST and extracts the neccasary parts
 * @param {Object} tree tree of a python file
 * @returns Object containing the methods and all other code
 */
function parsePythonTree(tree){
    let code = {
        nonKeyCode : [],
        start_up : null,
        events : []
    };

    for (let i = 0; i < tree.body.length; i++){
        if (checkForStartUp(tree.body[i])){
            if (code.start_up != null)
                throw new Error("Multiple start_up nodes found\nPlease ensure you only have one start_up method");
            code.start_up = tree.body[i].body.body;
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

function checkEvent(node){
    let eventFormat = /^[^_]*_[^_]*_[^_]*$/;

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

function constructEvent(eventData){
    let eventStructure = `document.getElementById('${eventData.elementId}\').addEventListener('${eventData.eventType}', ${eventData.funcName})`;
    console.log(eventStructure);
    let AST = codeToAST(eventStructure);
    return AST[0];
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
 * Locates and inserts into the whenReady function definition
 * @param {object} node node to insert into the whenReady function
 * @param {Array} codeToAdd Array of code to add
 */
function addToWhenReady(node, codeToAdd){
    visit(node, (node, parent, key) => {
        if (node.type === "CallExpression"){
            if (node.callee.type === "MemberExpression"){
                if (node.callee.object.type === "CallExpression" && node.callee.property.type === "Identifier"){
                    if (node.callee.object.callee.type === "MemberExpression" && node.callee.property.name === "then"){
                        if (node.callee.object.callee.object.name === "app" && node.callee.object.callee.property.name === "whenReady"){
                            // the node is located append the code to the end of the tree
                            addMultipleNodesToEnd(node.arguments[0].body, codeToAdd);
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    });
}

/**
 * String of code to parse into an AST
 * @param {String} code 
 */
function codeToAST(codeString){
    let code = acorn.parse(codeString, {ecmaVersion : 2022});
    return code.body;
}

/**
 * Checks if an object is an object
 * @param {object} node Node to check
 * @returns true if the object is a node
 */
function isNode(node){
    return typeof node === "object" && node !== null;
}

main()