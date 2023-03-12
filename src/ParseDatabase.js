// File to parse a tree and find any database calls to it
// first is to connect to database
// must be put in the start up
import { visit } from "./NodeUtils.js";
import { codeToAST } from "./NodeUtils.js";
import { insertAtIndex } from "./NodeUtils.js";


/**
 * Parses the tree and looks for database calls 
 */
function parseElectronDBTree(tree, backendJS){
    // add the mongodb import
    addMongoDBImport(backendJS);

    // add the client code


    visit(tree, (node, parent, key) =>{
        let connectionData = checkConnectNode(node, parent);
        if (connectionData !== null){
            // found a connection node
            console.log("Found a connection node");
            // create a connection 
            addClientElectron(backendJS, connectionData.connString, connectionData.dbName);
            delete node.expression;
            delete node.callee;
            node.type = "EmptyStatement";

        }
    });
}

function addMongoDBImport(tree){
    // turn the import into an import
    let importCode = "const { MongoClient } = require('mongodb');";
    let AST = codeToAST(importCode);
    console.log(AST[0]);
    console.log("AFTER AST");
    tree.body.unshift(AST[0]);
    console.log("ADDING IMPORT");
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


    //let clientCodeString = `const client = new MongoClient('${connString}');`;
    //let connCodeString = "const conn = client.connect();"
    //let dbCodeString = `let database = conn.db('${dbName}');`
    //let clientCode = codeToAST(clientCodeString);
    //let connCode = codeToAST(connCodeString);
    //let dbCode = codeToAST(dbCodeString);
    //insertAtIndex(tree, 2, clientCode[0]);
    //insertAtIndex(tree, 3, connCode[0]);
    //insertAtIndex(tree, 4, dbCode[0]);

}


/**
 * Checks if a node matches the pattern for a connection
 * @param {Object} node Node to check
 */
function checkConnectNode(node, parent){
    // will have structue as : connectDB("connString")

    if (node.type === "ExpressionStatement"){
        if (node.expression.type === "CallExpression"){
            if (node.expression.callee.type === "Identifier"){
                if (node.expression.callee.name === "connectDB"){
                    // check if the node contains one arg of type string
                    let args = node.expression.arguments;
                    if (args.length !== 2 || args[0].type !== "Literal" || typeof args[0].value !== "string" ||
                     args[1].type !== "Literal" || typeof args[1].value !== "string"){
                        throw new Error(`DB connection can only be of type string`);
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

export {parseElectronDBTree};