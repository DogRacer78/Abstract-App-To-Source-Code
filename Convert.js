import fs from "fs";
import {toJs} from 'estree-util-to-js';
import exec from "child_process";
import * as acorn from "acorn";
import { PythonShell } from "python-shell";
import { parse } from "node-html-parser";

/*
// read in the python file
var pythonFile = fs.readFileSync("./App.py", "utf-8")

// the python tree
var pythonTree = filbert.parse(pythonFile)
console.log(pythonTree.type)
*/

// the entry point of the program
function main(){
    let nameProject = process.argv[2];
    let typeAppToCreate = process.argv[3];
    let webflowAddress = process.argv[4];

    //console.log(pathToProject)
    //console.log(typeAppToCreate)

    if (typeAppToCreate === "-electron"){
        createElectronApp(nameProject);
        updateElectronJS(nameProject);
    }
    else if (typeAppToCreate === "-uelectron"){
        updateElectronJS(nameProject, webflowAddress);
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
async function updateElectronJS(projectName, htmlAddress){
    // first we need to call the python script and obtain the code
    PythonShell.run('./Tools/ConvertAppToJS.py', null, async (err, results) =>{
        try{
            if (err) throw err;
        }
        catch (e){
            console.log(`\n********************************************************
Error transpilation of App.py, enure the syntax is correct
Please ensure you have the following:
Python (www.python.org)
JavaScripthon (https://pypi.org/project/javascripthon/)
If you have pip installed simply run : pip install javascripthon
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
        let indexHTML;

        let res = await fetch(htmlAddress);
        indexHTML = await res.text();

        console.log(indexHTML);
        

        try{
            // load the electron main.js template
            indexJSTree = JSON.parse(fs.readFileSync("./templates/blank.json", "utf-8"));

            //load the HTML from the webflow published site
            

            // create the AST of the python code
            pythonAppTree = acorn.parse(pythonApp, {ecmaVersion : 2022});
            // parse the python AST
            pythonCodeParsed = parsePythonTree(pythonAppTree);
            // add the other code to the index.js file
            
            addCommentsToEnd(indexJSTree, "Function Definitions")
            addMultipleNodesToEnd(indexJSTree, pythonCodeParsed.nonKeyCode);
            //addCommentsToEnd(indexJSTree, "\n\n");

            addCommentsToEnd(indexJSTree, "Event listeners new line");
            addMultipleNodesToEnd(indexJSTree, pythonCodeParsed.events);
            //addCommentsToEnd(indexJSTree, "\n\n");

            addCommentsToEnd(indexJSTree, "On load event listener");
            addMultipleNodesToEnd(indexJSTree, pythonCodeParsed.start_up);

            addCommentsToEnd(indexJSTree, "This is my test comment\non a new line");

            //console.log(JSON.stringify(indexJSTree, null, 3));

            // compile the modified AST back into JS
            newIndexJS = toJs(indexJSTree);
            // write back out to the index.js file
            fs.writeFileSync("./" + projectName + "/index.js", newIndexJS.value);

            // now parse through the html from the WebFlow app and check for fake-form=true
            //parse the HTML
            let root = parse(indexHTML);
            let divElements = root.getElementsByTagName("div");

            for (let i = 0; i < divElements.length; i++){
                let element = divElements[i];
                if (element.getAttribute("fake-form") === "true"){
                    console.log(element);
                    element.setAttribute("class", element.getAttribute("class").replace("w-form", ""));
                }
            }

            // add the index.js script tag to the end
            root.insertAdjacentHTML("beforeend", "<script src='./index.js'></script>");

            // now try and send to the correct HTML file
            fs.writeFileSync("./" + projectName + "/index.html", root.toString());

            //console.log(root.querySelector("[fake-form='true']"));


            console.log(`
   _____ __  ______________________________
  / ___// / / / ____/ ____/ ____/ ___/ ___/
  \\__ \\/ / / / /   / /   / __/  \\__ \\\\__ \\ 
 ___/ / /_/ / /___/ /___/ /___ ___/ /__/ / 
/____/\\____/\\____/\\____/_____//____/____/  
                                                                                                           
`)
        }
        catch (e){
            console.error(e.message);
            console.error(e.name);
        }
    });
    
}

// function to parse the HTML from the WebFlow site and look for the fake-form attribute
function parseHTML(html){

}

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
        start_up : [],
        events : []
    };

    getComments(tree, (node, parent, key) => {
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
                                throw new Error("invalid Syntax for a comment block\nMust contain a single string with no string concatanations");
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

    manipulateGetValue(tree);

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

// function to visit all nodes in the tree and locate the comment nodes
function getComments(tree, callback){
    console.log("GETTING COMMENTS");
    visit(tree, callback);
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
 * @param {object} tree node to insert into the whenReady function
 * @param {Array} codeToAdd Array of code to add
 */
function constructStartUp(){
    let onLoadCode = `window.addEventListener('load', start_up);`;
    let AST = codeToAST(onLoadCode);
    return AST;
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