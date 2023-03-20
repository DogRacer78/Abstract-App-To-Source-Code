// File to parse a tree and find any database calls to it
// first is to connect to database
// must be put in the start up
import { addCommentsToEnd } from "./Comments.js";
import { ASTToCode, visit } from "./NodeUtils.js";
import { codeToAST } from "./NodeUtils.js";
import { insertAtIndex } from "./NodeUtils.js";
import { addNodeToEnd } from "./NodeUtils.js";

let eventID = 1;

/**
 * Parses the tree and looks for database calls 
 */
function parseElectronDBTree(frontendJS, backendJS){
    // add the mongodb import
    addMongoDBImport(backendJS);

    // add the fron end electron and ipc imports
    addElectronImport(frontendJS);

    // handles connection nodes
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

    // comments for ipc Communication
    addCommentsToEnd(backendJS, "\nIPC for communicating with front end\n");

    // handle load data nodes
    visit(frontendJS, (node, parent, key) => {
        let loadDataNode = checkLoadDataNode(node);
        if (loadDataNode !== null){
            console.log("Found a load data node");
            // create ipc code needed
            addipcLoadData(backendJS, loadDataNode, node);
        }
    });

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
    console.log("Looking for a load data node");

    if (node.type === "CallExpression"){
        if (node.callee.type === "Identifier"){
            if (node.callee.name === "dbLoadData"){
                console.log("Found a load data node");
                // get the args, should be 2
                let args = node.arguments;
                if (args.length !== 2 || args[0].type !== "Literal" || typeof args[0].value !== "string"){
                    throw new Error(`DBLoadData must follow pattern DBLoadData("collection name", dict)`);
                }
                // split the data as needed
                return { collectionName : args[0].value, searchDict : ASTToCode(args[1]) };
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
                if (args.length !== 2 || args[0].type !== "Literal" || typeof args[0].value !== "string" 
                    || args[1].type !== "ObjectExpression"){
                    throw new Error(`InsertData must have format dbInsertData("collection name", {dataname : data})`);
                }
                let insertDataString = ASTToCode(args[1]);
                console.log(`Collection name: ${args[0].value}, data: ${insertDataString}`);
                // create object with connection data
                return { 
                    collectionName : args[0].value,
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
                if (args.length !== 3 || args[0].type !== "Literal" || typeof args[0].value !== "string" 
                    || args[1].type !== "ObjectExpression" || args[2].type !== "ObjectExpression"){
                    throw new Error(`dbUpdateData must follow pattern dbUpdateData("collection name", {filter}, {data})`);
                }
                let filterCode = ASTToCode(args[1]);
                let updateDataCode = ASTToCode(args[2]);

                console.log(`filter : ${filterCode}, update : ${updateDataCode}`);
                // create object with connection data
                return { 
                    collectionName : args[0].value,
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
                if (args.length !== 2 || args[0].type !== "Literal" || typeof args[0].value !== "string" 
                    || args[1].type !== "ObjectExpression"){
                    throw new Error(`dbDeleteData must follow pattern dbDeletData("collection name", { delete filter })`);
                }
                let deleteFilterData = ASTToCode(args[1]);

                console.log(`Delete Filter : ${deleteFilterData}`);
                // create object with connection data
                return { 
                    collectionName : args[0].value,
                    filterData : deleteFilterData
                };
            }
        }
    }
    return null;
}



// creates the correct code for a load data between the front and backend
function addipcLoadData(backendJS, loadDataObj, node){
    // backend ipc event listener
    let backendIPC = `ipcMain.on('${eventID}', async function(event, searchData){
        let dataOut;
    try{
        dataOut = await database.collection('${loadDataObj.collectionName}').find(searchData).toArray();
        dataOut = JSON.stringify(dataOut);
    }
    catch(e){
        if (e.name === "UnhandledPromiseRejectionWarning" || e.name === "TypeError"){
            dataOut = null;
        }
        else{
            throw e;
        }
    }
    finally{
        event.returnValue = dataOut;
    }

    
});`;

    let frontEndCode = `JSON.parse(ipc.sendSync('${eventID}', ${loadDataObj.searchDict}))`
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
    let backendIPC = `ipcMain.on('${eventID}', async function(event, insertData){
        let result;

        try{
            await database.collection('${insertDataObj.collectionName}').insertOne(insertData);
            result = "Success";
        }
        catch(e){
            if (e.name === "UnhandledPromiseRejectionWarning" || e.name === "TypeError"){
                result = null;
            }
            else{
                throw e;
            }
        }
        finally{
            event.returnValue = result;
        }
    });`;

    let frontEndIpc = `ipc.sendSync('${eventID}', ${insertDataObj.insertData});`;
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
    let backEndCode = `ipcMain.on('${eventID}', async function(event, filter, updateData){
        let result;

        try{
            let out = await database.collection('${updateData.collectionName}').updateOne(
                filter, 
                {$set : updateData}, 
                { upsert : false }
            );
            result = out.modifiedCount;
        }
        catch(e){
            if (e.name === "UnhandledPromiseRejectionWarning" || e.name === "TypeError"){
                result = null;
            }
            else{
                throw e;
            }
        }
        finally{
            event.returnValue = result;
        }
    });`;

    let frontEndCode = `ipc.sendSync('${eventID}', ${updateData.filterData}, ${updateData.updateData});`

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
    let backEndCode = `ipcMain.on('${eventID}', async function(event, filter){
        let result;
        try{
            let out = await database.collection('${deleteNode.collectionName}').deleteOne(filter);
            result = out.deletedCount;
        }
        catch(e){
            if (e.name === "UnhandledPromiseRejectionWarning" || e.name === "TypeError"){
                result = null;
            }
            else{
                throw e;
            }
        }
        finally{
            event.returnValue = result;
        }
    });`;

    let frontEndCode = `ipc.sendSync('${eventID}', ${deleteNode.filterData});`;

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


export {parseElectronDBTree};