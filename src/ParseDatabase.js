// File to parse a tree and find any database calls to it

import { addCommentsToEnd } from "./Comments.js";
import { addMultipleNodesToEnd, ASTToCode, visit } from "./NodeUtils.js";
import { codeToAST } from "./NodeUtils.js";
import { insertAtIndex } from "./NodeUtils.js";
import { addNodeToEnd } from "./NodeUtils.js";

let eventID = 1;

/**
 * Parses the AST of an electron app and creates the relevant front and backend code modifications
 * @param {Object} frontendJS AST of the frontend JS
 * @param {Object} backendJS AST of the backend JS
 * @param {boolean} TEST if true will not add comments
 */
function parseElectronDBTree(frontendJS, backendJS, TEST = false){
    eventID = 1;

    // add the from end electron and ipc imports
    addElectronImport(frontendJS);

    // comments for ipc Communication
    if (!TEST){
        addCommentsToEnd(backendJS, "\n\n\nIPC for communicating with front end\n\n");
        addCommentsToEnd(backendJS, "\n\nUpdate Nodes\n\n");
    }
    

    // handle load data nodes
    visit(frontendJS, (node, parent, key) => {
        let loadDataNode = checkLoadDataNode(node);
        if (loadDataNode !== null){
            console.log("Found a load data node");
            // create ipc code needed
            addipcLoadData(backendJS, loadDataNode, node);
        }
    });

    if (!TEST)
        addCommentsToEnd(backendJS, "\n\nInsert Nodes\n\n");

    // handle insert data nodes
    visit(frontendJS, (node, parent, key) =>{
        let insertDataNode = checkInsertDataNode(node);
        if (insertDataNode !== null){
            console.log("Found an insert data node");
            addIpcInsertData(backendJS, insertDataNode, node);
        }
    });

    // handle update data nodes
    visit(frontendJS, (node, parent, key) => {
        let updateDataNode = checkUpdateNode(node);
        if (updateDataNode !== null){
            console.log("Found an update data node");
            addIpcUpdateData(backendJS, updateDataNode, node);
        }
    });

    
    // handle delete data nodes
    visit(frontendJS, (node, parent, key) => {
        let deleteDataNode = checkDeleteNode(node);
        if (deleteDataNode !== null){
            console.log("Found a delete data node");
            // add the relevant ipc code
            addIpcDeleteData(backendJS, deleteDataNode, node);
        }
    });

    let updateChangeFound = false;
    let insertChangeFound = false;
    let deleteChangeFound = false;
    // loop through the front end JS and check for on update, delete and insert
    for (let i = 0; i < frontendJS.body.length; i++){
        if (checkOnUpdateNode(frontendJS.body[i])){
            if (!updateChangeFound){
                console.log("Found a update node");
                updateChangeFound = true;
                // make the changes
                manipulateUpdateChange(frontendJS, backendJS);
            }
            else{
                throw new Error("Can only contain one updateChange Method")
            }
            
        }
        // checks for insert change events
        else if (checkOnInsertChange(frontendJS.body[i])){
            if (!insertChangeFound){
                // manipulate the insert change node
                console.log("Found an insert change event");
                insertChangeFound = true;
                manipulateInsertChange(frontendJS, backendJS);
            }
            else{
                throw new Error("Can only contain one insertChange Method");
            }
        }
        // checks for delete change events
        else if (checkOnDeleteChange(frontendJS.body[i])){
            if (!deleteChangeFound){
                console.log("Found a delete change event");
                deleteChangeFound = true;
                manipulateDeleteChange(frontendJS, backendJS);
            }
            else{
                throw new Error("Can only contain one deleteChange method");
            }
        }
    }
    
}

/**
 * Parses the AST of a web app and creates the relevant front end code modifications
 * @param {Object} frontendJS AST of the frontend JS
 * @param {Array} webHelper Array of AST nodes for the web helper methods
 * @param {Boolean} TEST If true will not add comments
 */
function parseWebDBTree(frontendJS, webHelper, TEST = false){
    console.log("************** PARSING WEB DB TREE ******************");

    // will need to loop through each tree and add the correct post
    // dbLoadData(dbName, collName, data);
    
    // callbacks will not work correctly, I believe
    // the best way to do this is to loop through all the function definitions, make them async, add to a list
    // look for any calls and add an await in front of it

    // add the web helper methods
    addMultipleNodesToEnd(frontendJS, webHelper);

    // all function defs
    let functionDefNames = [];

    // iterate through the tree and find any function definitions
    // make them async, if they are not a bufferData function, as that is an object in the helper
    visit(frontendJS.body, (node, parent, key) => {
        if (node.type === "FunctionDeclaration" && node.id.name !== "BufferData"){
            // if function make async
            console.log("Found func def");
            node.async = true;
            functionDefNames.push(node.id.name);
        }
    });

    console.log(functionDefNames);

    // iterate again to find any functions and make them await
    visit(frontendJS.body, (node, parent, key) => {
        if (checkCall(node, parent)){
            if (functionDefNames.includes(node.callee.name)){
                manipulateAwaits(node);
            }
        }
    });

    // iterate again to check the format of the db methods
    // will throw an error if the format is incorrect
    visit(frontendJS.body, (node, parent, key) => {
        checkLoadDataNode(node);
        checkInsertDataNode(node);
        checkUpdateNode(node);
        checkDeleteNode(node);
    });

    console.log("Looking for change events");

    let updateChangeFound = false;
    let insertChangeFound = false;
    let deleteChangeFound = false;
    // loop through top level and look for change events
    // function definitions can only be on the top level of the program
    for (let i = 0; i < frontendJS.body.length; i++){
        if (checkOnUpdateNode(frontendJS.body[i])){
            if (!updateChangeFound){
                console.log("Found a update node");
                updateChangeFound = true;
                // make the changes
                manipulateUpdateChangeWeb(frontendJS);
            }
            else{
                throw new Error("Can only contain one updateChange Method");
            }
            
        }
        // checks for insert change events
        else if (checkOnInsertChange(frontendJS.body[i])){
            if (!insertChangeFound){
                // manipulate the insert change node
                console.log("Found an insert change event");
                insertChangeFound = true;
                manipulateInsertChangeWeb(frontendJS);
            }
            else{
                throw new Error("Can only contain one insertChange Method");
            }
        }
        // checks for delete change events
        else if (checkOnDeleteChange(frontendJS.body[i])){
            if (!deleteChangeFound){
                console.log("Found a delete change event");
                deleteChangeFound = true;
                manipulateDeleteChangeWeb(frontendJS);
            }
            else{
                throw new Error("Can only contain one deleteChange method");
            }
        }
    }
}

/**
 * Checks if the AST node is not part of an await expression
 * @param {Object} node AST node
 * @param {Object} parent Parent of the AST node
 * @returns {Boolean} true if it is a call expression and not part of an await expression, false otherwise
 */
function checkCall(node, parent){
    if (parent != null){
        if (parent.type === "AwaitExpression"){
            return false;
        }
    }

    if (node.type === "CallExpression"){
        if (node.callee.type === "Identifier"){
            return true;
        }
    }
    return false;
}

/**
 * Manipulates the AST node to be an await expression
 * @param {Object} node Node to be manipulated 
 */
function manipulateAwaits(node){
    let name = node.callee.name;
    let args = node.arguments;
    let option = node.optional;

    node.type = "AwaitExpression";
    node.argument = {
        "type" : "CallExpression",
        "callee" : {
            "type" : "Identifier",
            "name" : name
        },
        "arguments" : args,
        "optional" : option
    };

    delete node.callee;
}

/**
 * Manipulates and adds a update change event to the front end JS for a web app
 * @param {Object} frontEndJS AST of the front end JS
 */
function manipulateUpdateChangeWeb(frontEndJS){
    const code = `localSocketConn.on("update_change", (data) => {
        updateChange();
    });`

    const AST = codeToAST(code);

    addNodeToEnd(frontEndJS, AST[0]);
}

/**
 * Manipulates and adds a delete change event to the front end JS for a web app
 * @param {Object} frontEndJS AST of the front end JS
 */
function manipulateDeleteChangeWeb(frontEndJS){
    const code = `localSocketConn.on("delete_change", (data) => {
        deleteChange();
    });`

    const AST = codeToAST(code);

    addNodeToEnd(frontEndJS, AST[0]);
}

/**
 * Manipulates and adds a insert change event to the front end JS for a web app
 * @param {Object} frontEndJS AST of the front end JS
 */
function manipulateInsertChangeWeb(frontEndJS){
    const code = `localSocketConn.on("insert_change", (data) => {
        insertChange();
    });`

    const AST = codeToAST(code);

    addNodeToEnd(frontEndJS, AST[0]);
}

/**
 * @deprecated Since version 1.0.0. The connection is handled automatically since
 * version 1.1.0
 * @param {Object} backEnd AST node to add the connection to
 */
function addMongoDBImport(backEnd){
    // turn the import into an import
    let importCode = "const { MongoClient } = require('mongodb');";
    let AST = codeToAST(importCode);
    console.log(AST[0]);
    backEnd.body.unshift(AST[0]);

}

/**
 * Adds an electron import to the front end JS
 * @param {Object} frontEnd AST node to add the electron import to
 */
function addElectronImport(frontEnd){
    // adds the electron import and the ipc reference to index.js
    let codeString = `const electron = require("electron");
const ipc = electron.ipcRenderer;`;
    let AST = codeToAST(codeString);
    insertAtIndex(frontEnd, 0, AST[0]);
    insertAtIndex(frontEnd, 1, AST[1]);
}

/**
 * @deprecated Since version 1.0.0. The connection is handled automatically since version 1.1.0
 * @param {*} tree 
 * @param {*} connString 
 * @param {*} dbName 
 */
function addClientElectron(tree, connString, dbName){
    let connectionCode = `let database;
(async () =>{
    try{
        const client = new MongoClient('${connString}', { serverSelectionTimeoutMS : 2000 });
        const conn = await client.connect();
        database = conn.db('${dbName}');
        console.log("Connected to DB");
    }
    catch(e){
        if (e.name === "MongoServerSelectionError"){
          console.log("Could not connect to mongoDB, database operations will not function");
        }
        else{
          throw e;
        }
    }
    finally{
        app.whenReady().then(() => {
          createWindow();
        });
    }
})();`

    let code = codeToAST(connectionCode);

    for (let i = 0; i < code.length; i++){
        insertAtIndex(tree, 2 + i, code[i]);
    }

}


/**
 * @deprecated Since version 1.0.0. The connection is handled automatically since version 1.1.0
 * Checks if a node matches the pattern for a connection
 * @param {Object} node Node to check
 */
function checkConnectNode(node){
    // will have structue as : connectDB("connString")

    if (node.type === "ExpressionStatement"){
        if (node.expression.type === "CallExpression"){
            if (node.expression.callee.type === "Identifier"){
                if (node.expression.callee.name === "connectDB"){
                    // check if the node contains one arg of type string
                    let args = node.expression.arguments;
                    if (args.length !== 2 || args[0].type !== "Literal" || typeof args[0].value !== "string" ||
                     args[1].type !== "Literal" || typeof args[1].value !== "string"){
                        throw new Error(`DB connection can only be of type string and follows pattern connectDB("connection string", "db name")`);
                    }

                    console.log(`Connection String is ${args[0].value} and DB name is ${args[1].value}`);
                    // create object with connection data
                    return { 
                        connString : args[0].value,
                        dbName : args[1].value
                    };

                }
            }
        }
    }
    return null;
}

/**
 * Checks if the node supplied matches the pattern for a load data node
 * @param {Object} node AST node to check
 * @returns {Object} Object containing the collection name and the data to load, or null if no node is found
 */
function checkLoadDataNode(node){
    // a load data node : DBLoadData("collection name", dict);
    //console.log("Looking for a load data node");

    if (node.type === "CallExpression"){
        if (node.callee.type === "Identifier"){
            if (node.callee.name === "dbLoadData"){
                console.log("Found a load data node");
                // get the args, should be 3
                let args = node.arguments;
                if (args.length !== 3 || args[0].type !== "Literal" || typeof args[0].value !== "string" ||
                    args[1].type !== "Literal" || typeof args[1].value !== "string" || args[2].type !== "ObjectExpression"){
                    throw new Error(`dbLoadData must follow pattern dbLoadData("DB Name", "collection name", dict)`);
                }
                // split the data as needed
                return { 
                    dbName : args[0].value,
                    collectionName : args[1].value, 
                    searchDict : ASTToCode(args[2]) 
                };
            }
        }
    }
    return null;
}


/**
 * Checks if the insert data node matches the pattern for an insert data node
 * @param {Object} node AST node to check
 * @returns {Object} Object containing the relevant data, or null if no node is found
 */
function checkInsertDataNode(node){
    // used to insert into the database dbInsertData("collection name", {dataname : data})

    if (node.type === "CallExpression"){
        if (node.callee.type === "Identifier"){
            if (node.callee.name === "dbInsertData"){
                // check if the node contains one arg of type string
                let args = node.arguments;
                if (args.length !== 3 || args[0].type !== "Literal" || typeof args[0].value !== "string" ||
                    args[1].type !== "Literal" || typeof args[1].value !== "string"
                    || args[2].type !== "ObjectExpression"){
                    throw new Error(`InsertData must have format dbInsertData("DB Name", "collection name", {dataname : data})`);
                }
                let insertDataString = ASTToCode(args[2]);
                console.log(`Collection name: ${args[0].value}, data: ${insertDataString}`);
                // create object with connection data
                return { 
                    dbName : args[0].value,
                    collectionName : args[1].value,
                    insertData : insertDataString
                };
            }
        }
    }
    return null;
}

/**
 * Checks if the update data node matches the pattern for an update data node
 * @param {Object} node AST node to check
 * @returns Object containing the relevant data, or null if no node is found
 */
function checkUpdateNode(node){
    if (node.type === "CallExpression"){
        if (node.callee.type === "Identifier"){
            if (node.callee.name === "dbUpdateData"){
                // check if the node contains one arg of type string
                let args = node.arguments;
                if (args.length !== 4 || args[0].type !== "Literal" || typeof args[0].value !== "string" ||
                    args[1].type !== "Literal" || typeof args[1].value !== "string" 
                    || args[2].type !== "ObjectExpression" || args[3].type !== "ObjectExpression"){
                    throw new Error(`dbUpdateData must follow pattern dbUpdateData("DB Name", "collection name", {filter}, {data})`);
                }
                let filterCode = ASTToCode(args[2]);
                let updateDataCode = ASTToCode(args[3]);

                console.log(`filter : ${filterCode}, update : ${updateDataCode}`);
                // create object with connection data
                return { 
                    dbName : args[0].value,
                    collectionName : args[1].value,
                    filterData : filterCode,
                    updateData : updateDataCode
                };
            }
        }
    }
    return null;
}

/**
 * Checks if the delete data node matches the pattern for a delete data node
 * @param {Object} node AST node to check
 * @returns {Object} Object containing the relevant data, or null if no node is found
 */
function checkDeleteNode(node){
    if (node.type === "CallExpression"){
        if (node.callee.type === "Identifier"){
            if (node.callee.name === "dbDeleteData"){
                // check if the node contains two args of type string and ObjectExpression
                let args = node.arguments;
                if (args.length !== 3 || args[0].type !== "Literal" || typeof args[0].value !== "string" ||
                    args[1].type !== "Literal" || typeof args[1].value !== "string" 
                    || args[2].type !== "ObjectExpression"){
                    throw new Error(`dbDeleteData must follow pattern dbDeletData("collection name", { delete filter })`);
                }
                let deleteFilterData = ASTToCode(args[2]);

                console.log(`Delete Filter : ${deleteFilterData}`);
                // create object with connection data
                return { 
                    dbName : args[0].value,
                    collectionName : args[1].value,
                    filterData : deleteFilterData
                };
            }
        }
    }
    return null;
}

/**
 * Checks if the node is a loadChange node
 * @param {Object} node AST node to check
 * @returns {boolean} true if the node is a loadChange node, false otherwise
 */
function checkOnUpdateNode(node){
    if (node.type === "FunctionDeclaration"){
        if (node.id.type === "Identifier"){
            if (node.id.name === "updateChange"){
                return true;
            }
        }
    }
    return false;
}

/**
 * Checks if the node is a loadChange node
 * @param {Object} node AST node to check
 * @returns {boolean} true if the node is a loadChange node, false otherwise
 */
function checkOnInsertChange(node){
    if (node.type === "FunctionDeclaration"){
        if (node.id.type === "Identifier"){
            if (node.id.name === "insertChange"){
                return true;
            }
        }
    }
    return false;
}

/**
 * Checks if the node is a loadChange node
 * @param {Object} node AST node to check
 * @returns {Boolean} true if the node is a deleteChange node, false otherwise
 */
function checkOnDeleteChange(node){
    if (node.type === "FunctionDeclaration"){
        if (node.id.type === "Identifier"){
            if (node.id.name === "deleteChange"){
                return true;
            }
        }
    }
    return false;
}

/**
 * Modifies the front and back end code to add the ipc event listener for the load data node
 * @param {Object} backendJS AST of the backend JS file
 * @param {Object} loadDataObj Object containing data about the load data node
 * @param {Object} node Front end node to be modified
 */
function addipcLoadData(backendJS, loadDataObj, node){
    // backend ipc event listener
    let backendIPC = `ipcMain.on('${eventID}', async function(event, dbName, collName, searchData){
    let res = await readData(new BufferData(dbName, collName, searchData, DataType.read));
    if (res === false)
        event.returnValue = "CONN_ERR";
    else
        event.returnValue = res;
});`;

    // front end ipc call
    let frontEndCode = `ipc.sendSync('${eventID}', '${loadDataObj.dbName}', '${loadDataObj.collectionName}', ${loadDataObj.searchDict})`;
    let frontEndAST = codeToAST(frontEndCode);

    // modify the front end node
    delete node.callee;
    delete node.arguments;
    delete node.optional;

    const keys = Object.keys(frontEndAST[0].expression);
    console.log(keys);
    for (let i = 0; i < keys.length; i++){
        node[keys[i]] = frontEndAST[0].expression[keys[i]];
    }

    // add the back end AST
    addNodeToEnd(backendJS, codeToAST(backendIPC)[0]);
    eventID++;
}

/**
 * Modifies the front and back end code to add the ipc event listener for the insert data node
 * @param {Object} backendJS AST of the backend JS file
 * @param {Object} insertDataObj Object containing data about the insert data node
 * @param {Object} node Front end node to be modified
 */
function addIpcInsertData(backendJS, insertDataObj, node){
    // backend ipc data
    let backendIPC = `ipcMain.on('${eventID}', async function(event, dbName, collName, dataForInsert){
        let res = await insertData(new BufferData(dbName, collName, dataForInsert, DataType.insert));
        if (!res){
            event.returnValue = "CONN_ERR";
        }
        else{
            event.returnValue = res;
        }
    });`;

    // front end ipc call
    let frontEndIpc = `ipc.sendSync('${eventID}', '${insertDataObj.dbName}', '${insertDataObj.collectionName}', ${insertDataObj.insertData});`;
    let frontEndAST = codeToAST(frontEndIpc);

    // modify the front end
    delete node.callee;
    delete node.arguments;
    delete node.optional;

    const keys = Object.keys(frontEndAST[0].expression);
    console.log(keys);
    for (let i = 0; i < keys.length; i++){
        node[keys[i]] = frontEndAST[0].expression[keys[i]];
    }

    // add the ipc code to the backend
    addNodeToEnd(backendJS, codeToAST(backendIPC)[0]);
    eventID++;
}

/**
 * Modifies the front and back end code to add the ipc event listener for the delete data node
 * @param {Object} backendJS AST of the backend JS file
 * @param {Object} updateData Object containing data about the update data node
 * @param {Object} node Front end node to be modified
 */
function addIpcUpdateData(backendJS, updateData, node){
    let backEndCode = `ipcMain.on('${eventID}', async function(event, dbName, collName, filter, dataForUpdate){
        let res = await updateData(new BufferData(dbName, collName, {'filter' : filter, 'updateData' : dataForUpdate}, DataType.update));
        if (!res){
            event.returnValue = "CONN_ERR";
        }
        else{
            event.returnValue = res;
        }
    });`;

    // front end ipc call
    let frontEndCode = `ipc.sendSync('${eventID}', '${updateData.dbName}', '${updateData.collectionName}', ${updateData.filterData}, ${updateData.updateData});`

    let backEndAST = codeToAST(backEndCode);
    console.log("CREATED BACKEND");

    let frontEndAST = codeToAST(frontEndCode);
    console.log("CREATED FRONTEND");

    // modify the front end
    delete node.callee;
    delete node.arguments;
    delete node.optional;

    const keys = Object.keys(frontEndAST[0].expression);
    console.log(keys);
    for (let i = 0; i < keys.length; i++){
        node[keys[i]] = frontEndAST[0].expression[keys[i]];
    }

    // add the ipc code to the backend
    addNodeToEnd(backendJS, backEndAST[0]);
    eventID++;
}

/**
 * Modifies the front and back end code to add the ipc event listener for the delete data node
 * @param {Object} backendJS AST of the backend JS file
 * @param {Object} deleteNode Object containing data about the delete data node
 * @param {Object} node Front end node to be modified
 */
function addIpcDeleteData(backendJS, deleteNode, node){
    // backend ipc event listener
    let backEndCode = `ipcMain.on('${eventID}', async function(event, dbName, collName, filter){
        let res = await deleteData(new BufferData(dbName, collName, filter, DataType.delete));
        if (!res){
            event.returnValue = "CONN_ERR";
        }
        else{
            event.returnValue = res;
        }
    });`;

    // front end ipc call
    let frontEndCode = `ipc.sendSync('${eventID}', '${deleteNode.dbName}', '${deleteNode.collectionName}', ${deleteNode.filterData});`;

    // turn the code into ASTs
    let backEndAST = codeToAST(backEndCode);
    let frontEndAST = codeToAST(frontEndCode);

    // modify the front end
    delete node.callee;
    delete node.arguments;
    delete node.optional;

    const keys = Object.keys(frontEndAST[0].expression);
    console.log(keys);
    for (let i = 0; i < keys.length; i++){
        node[keys[i]] = frontEndAST[0].expression[keys[i]];
    }

    // add the ipc code to the backend
    addNodeToEnd(backendJS, backEndAST[0]);
    eventID++;
}

/**
 * Manipulates the front and back end code to add the relevant code for an update change event in an electron app
 * @param {Object} frontendJS AST of the frontend JS file
 * @param {Object} backendJS AST of the backend JS file
 */
function manipulateUpdateChange(frontendJS, backendJS){
    let backEndCode = `socket.on("update_change", (data) => {
        console.log("Update change");
        win.webContents.send("update_change");
      });`;

    let frontEndCode = `ipc.on("update_change", (event) => {
        updateChange()
      });`;

    // add to the end of backendJS
    addNodeToEnd(backendJS, codeToAST(backEndCode)[0]);

    // add to the end of 
    addNodeToEnd(frontendJS, codeToAST(frontEndCode)[0]);
}

/**
 * Manipulates the front and back end code to add the relevant code for an insert change event in an electron app
 * @param {Object} frontendJS AST of the frontend JS
 * @param {Object} backendJS AST of the backend JS
 */
function manipulateInsertChange(frontendJS, backendJS){
    let backEndCode = `socket.on("insert_change", (data) => {
        console.log("Insert change");
        win.webContents.send("insert_change");
      });`;

    let frontEndCode = `ipc.on("insert_change", (event) => {
        insertChange()
      });`;

    // add to the end of backendJS
    addNodeToEnd(backendJS, codeToAST(backEndCode)[0]);

    // add to the end of 
    addNodeToEnd(frontendJS, codeToAST(frontEndCode)[0]);
}

/**
 * Manipulates the front and back end code to add the relevant code for a delete change event in an electron app
 * @param {Object} frontendJS AST of the frontend JS
 * @param {Object} backendJS AST of the backend JS
 */
function manipulateDeleteChange(frontendJS, backendJS){
    let backEndCode = `socket.on("delete_change", (data) => {
        console.log("Delete Change");
        win.webContents.send("delete_change");
      });`;

    let frontEndCode = `ipc.on("delete_change", (event) => {
        deleteChange()
      });`;

    // add to the end of backendJS
    addNodeToEnd(backendJS, codeToAST(backEndCode)[0]);

    // add to the end of 
    addNodeToEnd(frontendJS, codeToAST(frontEndCode)[0]);
}


export {parseElectronDBTree, parseWebDBTree};