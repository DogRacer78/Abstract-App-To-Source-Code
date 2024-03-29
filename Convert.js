#!/usr/bin/env node

/*
    Main file of the project
    Controls the overall creation of the app, contains the command functions and definitions
*/

import fs from "fs";
import {toJs} from 'estree-util-to-js';
import { exec, spawn } from "child_process";
import * as acorn from "acorn";
import { PythonShell } from "python-shell";
import {addCommentsToEnd, createComment} from "./src/Comments.js";
import { visit, addNodeToEnd, addMultipleNodesToEnd, codeToAST } from "./src/NodeUtils.js";
import { generateDateTime } from "./src/Util.js";
import { parsePythonTree } from "./src/ParsePythonTree.js";
import { addElectronIndex, addWebIndex, handleFakeForm } from "./src/HTMLParser.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import util from "util";
import path from "path";
import { fileURLToPath } from 'url';
import { parseElectronDBTree, parseWebDBTree } from "./src/ParseDatabase.js";
import { copyServerJS } from "./src/DatabaseServer.js";
import { stderr, stdout } from "process";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// the entry point of the program
function main(){
    // create the yargs options

    // web app command
    yargs(hideBin(process.argv)).command({
        command : "gen-web-app",
        describe : "Generates the necassary HTML and JavaScript files",
        builder : {
            name : {
                describe : "The name of the app",
                demandOption : true,
                type : "string"
            },
            html_address :{
                describe : "The URL to the web address of your published webflow site",
                demandOption : true,
                type : "string"
            },
            app_path : {
                describe : "Direcroty of your python app",
                demandOption : true,
                type : "string"
            }
        },
        handler(argv){
            createWebApp(argv.name, argv.html_address, argv.app_path);
        }
    }).command({ // electron app command
        command : "gen-electron-app",
        describe : "Generates an electron app with all node dependancies",
        builder : {
            name : {
                describe : "The name of the app",
                demandOption : true,
                type : "string"
            },
            html_address :{
                describe : "The URL to the web address of your published webflow site",
                demandOption : true,
                type : "string"
            },
            app_path : {
                describe : "Direcroty of your python app",
                demandOption : true,
                type : "string"
            }
        },
        handler(argv){
            createElectronApp(argv.name, argv.html_address, argv.app_path);
        }
    }).command({ // database server command
        command : "gen-db",
        describe : "Generates the database server needed",
        builder : {
            location : {
                describe : "The path to build the server to",
                demandOption : true,
                type : "string"
            }
        },
        handler(argv){
            copyServerJS(argv.location, __dirname);
        }
    }).parse();
    
}

/**
 * Creates a web app
 * @param {String} name Name of the app
 * @param {String} htmlAddress URL of the webflow site or local HTML path
 */
function createWebApp(name, htmlAddress, app_path){
    // create the app and wait for it to finish
    createApp(name, htmlAddress, app_path).then((appData) =>{
        // create valid paths to the app dir and public dir
        const appDir = path.join("./", name);
        const appDirPublic = path.join(appDir, "/public");

        // check if the app dir exists, if it does not then create it
        if (!fs.existsSync(appDir)) {
            fs.mkdirSync(appDir, { recursive : true });
        }

        // create the public dir if not exists
        if (!fs.existsSync(appDirPublic)){
            fs.mkdirSync(appDirPublic, { recursive : true });
        }

        // load the web helper methods from JSON
        let webHelperMethods = JSON.parse(fs.readFileSync(path.join(__dirname, "/templates/web_helper.json")));

        // process the dbCode
        parseWebDBTree(appData.indexJS, webHelperMethods);

        // change current dir to the app dir
        process.chdir(appDir);

        let indexJSCode = toJs(appData.indexJS);

        // add the indexjs reference to the HTML
        let indexHTML = addWebIndex(appData.indexHTML, appData.localHTML);
        
        fs.writeFileSync("./public/index.js", indexJSCode.value, { flag : "w" });
        fs.writeFileSync("./public/index.html", indexHTML, { flag : "w" });

        // move the app.js into the dir
        fs.copyFileSync(path.join(__dirname, "/templates/app.js"), "./app.js");

        // install the npm packages needed
        const packageInstall = exec("npm install express && npm install socket.io-client && npm install socket.io");

        packageInstall.stdout.on("data", (data) => {
            console.log(data);
        });

        packageInstall.stderr.on("data", (data) => {
            console.log(data);
        }); 
    });
}


/**
 * Creates an electron app
 * @param {String} name Name of the app
 * @param {String} htmlAddress URL of webflow site or local HTML path
 */
function createElectronApp(name, htmlAddress, app_path){
    console.log("Creating electron app");

    // create the app and wait for it to finish
    createApp(name, htmlAddress, app_path).then((appData) => {
        // get the path to the app
        const appDir = path.join("./", name);

        // load the main.js template
        let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "/templates/mainJS.json"), "utf-8"));

        // parse the database methods and add as needed
        parseElectronDBTree(appData.indexJS, mainJSTree);

        let mainJSCode = toJs(mainJSTree);

        // check if the app dir exists, if it does not then create it
        console.log(appData.indexJS[0]);
        if (!fs.existsSync(appDir)) {
            fs.mkdirSync(appDir, { recursive : true });
        }
    
        process.chdir(appDir);

        console.log(process.cwd());
        
        // install the npm packages needed
        console.log("Getting electron");
        exec("npm init -y && npm install electron --save-dev && npm install socket.io-client && npm install mongodb", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);

            // get the package.json and modify as needed
            console.log("getting PACKAGE");
            let packageJSON = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
            console.log(packageJSON)
            packageJSON.scripts.start = "electron .";
            packageJSON.main = "main.js";

            let indexJSCode = toJs(appData.indexJS);

            // add the index.js refernce to the HTML
            let indexHTML = addElectronIndex(appData.indexHTML);
    
            // write the files
            fs.writeFileSync("./index.js", indexJSCode.value);
            fs.writeFileSync("./index.html", indexHTML);
            fs.writeFileSync("./main.js", mainJSCode.value);
            fs.writeFileSync("./package.json", JSON.stringify(packageJSON, null, 4));
        });
        
    });

}

/**
 * 
 * @param {String} projectName Name of the project
 * @param {String} htmlAddress URL of webflow site or local HTML path
 * @param {boolean} TEST If true then the comments will not be added to the output
 * @returns {{indexJS : String, indexHTML : String}} Object with strings for the indexJS and indexHTML
 */
async function createApp(projectName, htmlAddress, appDir, TEST = false){
    let data = {};

    const runPythonFilePromise = util.promisify(PythonShell.run);

    let pythonApp;
    let indexJSTree;
    let pythonAppTree;
    let pythonCodeParsed;
    let newIndexJS;
    let indexHTML;


    let pythonOptions = 
    {
        args : [appDir]
    };

    // run the python script to convert the app.py to a js file
    console.log(`Trying to load app from from ${appDir}`);
    try{
        console.log(path.join(__dirname, "/Tools/ConvertAppToJS.py"));
        pythonApp = await runPythonFilePromise(path.join(__dirname, "/Tools/ConvertAppToJS.py"), pythonOptions);
        console.log(pythonApp);
        pythonApp = pythonApp.join('');
    }
    catch(e){
        // if an error occurs then we show the relevant error message
        console.log(`\n********************************************************
Error transpilation of app, enure the syntax is correct
Please ensure you have the following:
Python (www.python.org)
JavaScripthon (https://pypi.org/project/javascripthon/)
If you have pip installed simply run : pip install javascripthon
*******************************************************\n`);
            //console.log(e);
            if (!TEST)
                process.exit(-1);
    }

    try{
        // load the electron main.js template
        indexJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "./templates/blank.json"), "utf-8"));

        // create the AST of the python code
        pythonAppTree = acorn.parse(pythonApp, {ecmaVersion : 2022});
        // parse the python AST
        pythonCodeParsed = parsePythonTree(pythonAppTree);
        // add the other code to the index.js file

        // add the date time
        if (!TEST){
            addCommentsToEnd(indexJSTree, generateDateTime());
        }
        
        if (!TEST)
            addCommentsToEnd(indexJSTree, "Function Definitions")
        addMultipleNodesToEnd(indexJSTree, pythonCodeParsed.nonKeyCode);
        //addCommentsToEnd(indexJSTree, "\n\n");

        if (!TEST)
            addCommentsToEnd(indexJSTree, "Event listeners");
        addMultipleNodesToEnd(indexJSTree, pythonCodeParsed.events);
        //addCommentsToEnd(indexJSTree, "\n\n");

        if (!TEST)
            addCommentsToEnd(indexJSTree, "On load event listener");
        addMultipleNodesToEnd(indexJSTree, pythonCodeParsed.start_up);
        //console.log(JSON.stringify(indexJSTree, null, 3));

        // bool to check if the HTML is from a URL or a file
        let localHTML = false;

        // tries to get the html
        let res;
        try{
            // tries to fetch from the supplied URL
            res = await fetch(htmlAddress);
            console.log(res);
            if (res.status === 200)
                indexHTML = await res.text();
            else
                throw new Error(`Couldn't load HTML from ${htmlAddress}, please check the address supplied`);
        }
        catch(e){
            // if it is not a valid address try and open the file
            try{
                indexHTML = fs.readFileSync(htmlAddress, "utf-8");
                localHTML = true;
            }
            catch(fileErr){
                throw new Error(`Couldn't load HTML from ${htmlAddress}, please check the address supplied is a valid URL or a valid file`);
            }
        }
        

        // now parse through the html from the WebFlow app and check for fake-form=true
        //parse the HTML
        indexHTML = handleFakeForm(indexHTML);

        // set up the output data
        data.indexJS = indexJSTree;
        data.indexHTML = indexHTML;
        data.localHTML = localHTML;
        
        return data;

    }
    catch (e){
        // if an error occurs then we show the relevant error message
        console.error(e.message);
        //console.error(e.name);
        if (!TEST)
            process.exit(-1);

        // for testing we want to throw the error
        if (TEST)
            throw e;
    }
    
}

main()

export {createApp};