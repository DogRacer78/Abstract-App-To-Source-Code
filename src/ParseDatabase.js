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
    const client = new MongoClient('${connString}');
    const conn = await client.connect();
    database = conn.db('${dbName}');
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

// creates the correct code for a load data between the front and backend
function addipcLoadData(backendJS, loadDataObj, node){
    // backend ipc event listener
    let backendIPC = `ipcMain.on('${eventID}', async function(event, searchData){
    let dataOut = await database.collection('${loadDataObj.collectionName}').find(searchData).toArray();

    event.returnValue = JSON.stringify(dataOut);
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

export {parseElectronDBTree};