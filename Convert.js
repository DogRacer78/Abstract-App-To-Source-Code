// takes in a main.js file, converts to a syntax tree, then appends the available functions to the main.js tree, then back to js

import fs from "fs"
import {toJs} from 'estree-util-to-js'
import filbert from "filbert"
import exec from "child_process"
import * as acorn from "acorn"
import rapydscript from "rapydscript";

/*
// read in the python file
var pythonFile = fs.readFileSync("./App.py", "utf-8")

// the python tree
var pythonTree = filbert.parse(pythonFile)
console.log(pythonTree.type)
*/

// the entry point of the program
function main(){
    var nameProject = process.argv[2]
    var typeAppToCreate = process.argv[3]

    //console.log(pathToProject)
    //console.log(typeAppToCreate)

    if (typeAppToCreate === "-electron"){
        createElectronApp(nameProject)
    }
    else if (typeAppToCreate === "-uelectron"){
        updateElectronJS(nameProject)
    }
    else{
        console.error(typeAppToCreate + " not recognised as a project type")
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
    var packageJSON = JSON.parse(fs.readFileSync("./" + name + "/package.json", "utf-8"))
    console.log(packageJSON)
    packageJSON.scripts.start = "electron ."
    fs.writeFileSync("./" + name + "/package.json", JSON.stringify(packageJSON, null, 4));

    // get the syntax tree of a typical main.js for electron
    var mainJSTree = JSON.parse(fs.readFileSync("./templates/mainJS.json", "utf-8"))
    var mainJs = toJs(mainJSTree)
    fs.writeFileSync("./" + name + "/index.js", mainJs.value)

    //copy the basic html file to the app dir
    var htmlFile = fs.readFileSync("./templates/index.html", "utf-8");
    fs.writeFileSync("./" + name + "/index.html", htmlFile);

}

// will take the current index.js file in a project and add a console.log to the start up method
function updateElectronJS(projectName){
    // open the current file and parse it to a tree

    // may not need this
    /*
    var indexJSTree;
    try{
        var indexJS = fs.readFileSync("./" + projectName + "/index.js", "utf-8");
        indexJSTree = acorn.parse(indexJS, {ecmaVersion : 2022});
    }
    catch{
        console.error("Cannot open index.js in project folder, please check that an electron project exists there" + 
        "\nRun node Convert.js app_name -electron to create a new empty app");
        return;
    }
    */

    var indexJSTree = JSON.parse(fs.readFileSync("./templates/mainJS.json", "utf-8"));
    var stdLibTree = acorn.parse(fs.readFileSync("./baselib.js", "utf-8"), {ecmaVersion : 2022});

    // load in the python file
    var pythonAppTree;
    try{
        
    }
    catch{
        console.error("Please ensure your app file is names \"App.py\" and try again");
        return;
    }

    var pythonApp = fs.readFileSync("./App.pyj", "utf-8");
    var rapid = rapydscript.compile(pythonApp, {});
    console.log(rapid);
    pythonAppTree = acorn.parse(rapid, {ecmaVersion : 2022});

    // traversers the tree and inserts the start up code into the start_up of the index.js
    addToWhenReady(indexJSTree, parsePythonTree(pythonAppTree.body).start_up);

    // add the library to the end of the code
    addMultipleNodesToEnd(indexJSTree, stdLibTree.body);
    console.log(JSON.stringify(indexJSTree, null, 3));

    // output to the index.js file with the correct info
    var newIndexJS = toJs(indexJSTree);
    fs.writeFileSync("./" + projectName + "/index.js", newIndexJS.value);
}

function addNodeToEnd(tree, node){
    tree.body.push(node);
}

function addMultipleNodesToEnd(tree, nodes){
    for (let i = 0; i < nodes.length; i++){
        addNodeToEnd(tree, nodes[i]);
    }
}

// function to extract the start_up method for now
function parsePythonTree(tree){
    var code = {nonKeyCode : []};
    visit(tree, (node, parent, key) => {
        // looking for the start up method
        if (node.type === "FunctionDeclaration"){
            if (node.id.type === "Identifier"){
                if (node.id.name === "start_up"){
                    // found the node now extract the function body
                    code.start_up = node.body.body;
                    console.log(node.body.body);
                }
            }
        }
        // if it does not match any key methods then just treat it as a normal method
        else if (parent == "undefined"){
            code.nonKeyCode.push(node);
        }
    });
    return code;
}

// a recursive function to traverse the tree
// performs a depth first search on the tree
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
                    //console.log(child[j].type);
                    //console.log("HERE")
                    _visit(child[j], node, keys[i]);
                }
            }
            // if any of the properties of a node is a node, go down that branch
            else if (isNode(child)){
                //console.log(child.type);
                _visit(child, node, keys[i]);
            }
        }
    }
    _visit(tree, null);
}

// method to find the whenReady node and insert code below the createWindow() func
function addToWhenReady(node, codeToAdd){
    visit(node, (node, parent, key) => {
        if (node.type === "CallExpression"){
            if (node.callee.type === "MemberExpression"){
                if (node.callee.object.type === "CallExpression" && node.callee.property.type === "Identifier"){
                    if (node.callee.object.callee.type === "MemberExpression" && node.callee.property.name === "then"){
                        if (node.callee.object.callee.object.name === "app" && node.callee.object.callee.property.name === "whenReady"){
                            // the node is located append the code to the end of the
                            for (let i = 0; i < codeToAdd.length; i++)
                                node.arguments[0].body.body.push(codeToAdd[i]);
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    });
}

// custom callback that performs a simple traversal of the 
function search(node, nodeToFind){
    // get the keys
    let nodeKeys = Object.keys(node);
    let nodeToFindKeys = Object.keys(nodeToFind);
    // check the length of the key arrays
    // if they are the same then the nodes can be serached
    if (nodeKeys.length !== nodeToFindKeys.length)
        return false;

    // check for all the keys if they are the same
    for (let i = 0; i < nodeKeys.length; i++){
        if (nodeKeys[i] !== nodeToFind[i])
            return false;
    }

    // check for all the keys if the values are the same and if it is an object check its children
    for (let i = 0; i < nodeKeys.length; i++){
        //if ()
    }

}

/**
 * String of code to parse into an AST
 * @param {String} code 
 */
function codeToAST(codeString){
    let code = acorn.parse(codeString, {ecmaVersion : 2022});
    return code.body;
}

// checks if a key represents an object such as a node or an array
function isNode(node){
    return typeof node === "object" && node !== null;
}

main()