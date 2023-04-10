// File to parse a tree and find any database calls to it
// first is to connect to database
// must be put in the start up
import { addCommentsToEnd } from "./Comments.js";
import { addMultipleNodesToEnd, ASTToCode, visit } from "./NodeUtils.js";
import { codeToAST } from "./NodeUtils.js";
import { insertAtIndex } from "./NodeUtils.js";
import { addNodeToEnd } from "./NodeUtils.js";

let eventID = 1;

/**
 * Parses the tree and looks for database calls 
 */
function parseElectronDBTree(frontendJS, backendJS, TEST = false){
    // add the mongodb import
    //addMongoDBImport(backendJS);
    eventID = 1;

    // add the fron end electron and ipc imports
    addElectronImport(frontendJS);

    // handles connection nodes
    /*
    visit(frontendJS, (node, parent, key) =>{
        let connectionData = checkConnectNode(node);
        if (connectionData !== null){
            // found a connection node
            console.log("Found a connection node");
            // create a connection 
            addClientElectron(backendJS, connectionData.connString, connectionData.dbName);
            delete node.expression;
            delete node.callee;
            delete node.arguments;
            node.type = "EmptyStatement";

        }
    });
    */

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
 * Parses the frontendJS and looks for db connections and creates the correct code
 * @param {Object} frontendJS Object
 * @param {Obj} backendJS Object
 */
function parseWebDBTree(frontendJS, webHelper, TEST = false){
    // parses the tree and looks for the correct nodes
    console.log("************** PARSING WEB DB TREE ******************");

    // will need to loop through each tree and add the correct post
    // dbLoadData(dbName, collName, data);
    
    // callbacks will not work correctly, I belive
    // the best way to do this is to loop through all the function definitions, make them async, add to a list
    // look for any calls and add an await in front of it

    // add the web helper methods
    addMultipleNodesToEnd(frontendJS, webHelper);

    // all function defs
    let functionDefNames = [];

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
    // loop through top level and look for
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

// manipulates a call expression to become await
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

function manipulateUpdateChangeWeb(frontEndJS){
    const code = `localSocketConn.on("update_change", (data) => {
        updateChange();
    });`

    const AST = codeToAST(code);

    addNodeToEnd(frontEndJS, AST[0]);
}

function manipulateDeleteChangeWeb(frontEndJS){
    const code = `localSocketConn.on("delete_change", (data) => {
        deleteChange();
    });`

    const AST = codeToAST(code);

    addNodeToEnd(frontEndJS, AST[0]);
}

function manipulateInsertChangeWeb(frontEndJS){
    const code = `localSocketConn.on("insert_change", (data) => {
        insertChange();
    });`

    const AST = codeToAST(code);

    addNodeToEnd(frontEndJS, AST[0]);
}

function addMongoDBImport(backEnd){
    // turn the import into an import
    let importCode = "const { MongoClient } = require('mongodb');";
    let AST = codeToAST(importCode);
    console.log(AST[0]);
    backEnd.body.unshift(AST[0]);

}

function addElectronImport(frontEnd){
    // adds the electron import and the ipc reference to index.js
    let codeString = `const electron = require("electron");
const ipc = electron.ipcRenderer;`;
    let AST = codeToAST(codeString);
    insertAtIndex(frontEnd, 0, AST[0]);
    insertAtIndex(frontEnd, 1, AST[1]);
}

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

function checkLoadDataNode(node){
    // a load data node : DBLoadData("collection name", dict);
    //console.log("Looking for a load data node");

    if (node.type === "CallExpression"){
        if (node.callee.type === "Identifier"){
            if (node.callee.name === "dbLoadData"){
                console.log("Found a load data node");
                // get the args, should be 2
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


// checks for a node that inserts data
function checkInsertDataNode(node){
    // used to insert into the database dbInsertData("collection name", {dataname : data})
    console.log("Looking for a load data node");

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

// checks if an update node is prsent
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

// checks if a node is of type delete
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

// checks if the node is a insertChange node
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

// checks if the node is a deleteChange node
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



// creates the correct code for a load data between the front and backend
function addipcLoadData(backendJS, loadDataObj, node){
    // backend ipc event listener
    let backendIPC = `ipcMain.on('${eventID}', async function(event, dbName, collName, searchData){
    let res = await readData(new BufferData(dbName, collName, searchData, DataType.read));
    if (res === false)
        event.returnValue = "CONN_ERR";
    else
        event.returnValue = res;
});`;

    let frontEndCode = `ipc.sendSync('${eventID}', '${loadDataObj.dbName}', '${loadDataObj.collectionName}', ${loadDataObj.searchDict})`;
    let frontEndAST = codeToAST(frontEndCode);

    delete node.callee;
    delete node.arguments;
    delete node.optional;

    const keys = Object.keys(frontEndAST[0].expression);
    console.log(keys);
    for (let i = 0; i < keys.length; i++){
        node[keys[i]] = frontEndAST[0].expression[keys[i]];
    }

    addNodeToEnd(backendJS, codeToAST(backendIPC)[0]);
    eventID++;
}

// creates the necessary code for ipc communication for inserting data
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

    let frontEndIpc = `ipc.sendSync('${eventID}', '${insertDataObj.dbName}', '${insertDataObj.collectionName}', ${insertDataObj.insertData});`;
    let frontEndAST = codeToAST(frontEndIpc);

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

    let frontEndCode = `ipc.sendSync('${eventID}', '${updateData.dbName}', '${updateData.collectionName}', ${updateData.filterData}, ${updateData.updateData});`

    let backEndAST = codeToAST(backEndCode);
    console.log("CREATED BACKEND");

    let frontEndAST = codeToAST(frontEndCode);
    console.log("CREATED FRONTEND");

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

// adds the relvant ipc code for the delete node
function addIpcDeleteData(backendJS, deleteNode, node){
    let backEndCode = `ipcMain.on('${eventID}', async function(event, dbName, collName, filter){
        let res = await deleteData(new BufferData(dbName, collName, filter, DataType.delete));
        if (!res){
            event.returnValue = "CONN_ERR";
        }
        else{
            event.returnValue = res;
        }
    });`;

    let frontEndCode = `ipc.sendSync('${eventID}', '${deleteNode.dbName}', '${deleteNode.collectionName}', ${deleteNode.filterData});`;

    // turn the code into ASTs
    let backEndAST = codeToAST(backEndCode);
    let frontEndAST = codeToAST(frontEndCode);

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

// makes the changes for an updateChange method
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

// manipulates the insertChange nodes
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

// manipulate the updateChange nodes
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