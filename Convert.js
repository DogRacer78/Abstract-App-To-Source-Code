import fs from "fs";
import {toJs} from 'estree-util-to-js';
import exec from "child_process";
import * as acorn from "acorn";
import { PythonShell } from "python-shell";
import {addCommentsToEnd, createComment} from "./src/Comments.js";
import { visit, addNodeToEnd, addMultipleNodesToEnd, codeToAST } from "./src/NodeUtils.js";
import { generateDateTime } from "./src/Util.js";
import { parsePythonTree } from "./src/ParsePythonTree.js";
import { handleFakeForm } from "./src/HTMLParser.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import util from "util";

// the entry point of the program
function main(){
    //let nameProject = argv.name;
    //let typeAppToCreate = argv.type;
    //let webflowAddress = argv.html;

    // create the yargs options
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
            }
        },
        handler(argv){
            createWebApp(argv.name, argv.html_address);
        }
    }).command({
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
            }
        },
        handler(argv){
            createElectronApp(argv.name, argv.html_address);
        }
    }).parse();

    //yargs(hideBin(process.argv)).command({
        
    //}).parse();
    
}

function createWebApp(name, htmlAddress){
    createApp(name, htmlAddress).then((appData) =>{
        if (!fs.existsSync(`./${name}`)) {
            fs.mkdirSync(`./${name}`);
        }

        process.chdir(`./${name}`);
        
        fs.writeFileSync("./index.js", appData.indexJS);
        fs.writeFileSync("./index.html", appData.indexHTML);

    });
}


// will create an electron app by running the appropriate command
function createElectronApp(name, htmlAddress){

    // get the web app
    createApp(name, htmlAddress).then((appData) => {
        console.log(appData);
        if (!fs.existsSync(`./${name}`)) {
            fs.mkdirSync(`./${name}`);
        }

        // load the main.js template
        let mainJSTree = JSON.parse(fs.readFileSync("./templates/mainJS.json", "utf-8"));
        let mainJSCode = toJs(mainJSTree);
    
        process.chdir(`./${name}`);

        console.log(process.cwd());
        
        console.log("Getting electron");
        exec.exec("npm init -y && npm install electron --save-dev", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);

            console.log("getting PACKAGE");
            let packageJSON = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
            console.log(packageJSON)
            packageJSON.scripts.start = "electron .";
            packageJSON.main = "main.js";
    
            // write the files
            fs.writeFileSync("./index.js", appData.indexJS);
            fs.writeFileSync("./index.html", appData.indexHTML);
            fs.writeFileSync("./main.js", mainJSCode.value);
            fs.writeFileSync("./package.json", JSON.stringify(packageJSON, null, 4));
        });
        
    });

    


    /*
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
    */

}

// will take the current index.js file in a project and add a console.log to the start up method
async function createApp(projectName, htmlAddress){
    let data = {};

    const runPythonFilePromise = util.promisify(PythonShell.run);

    let pythonApp;
    let indexJSTree;
    let pythonAppTree;
    let pythonCodeParsed;
    let newIndexJS;
    let indexHTML;

    try{
        pythonApp = await runPythonFilePromise('./Tools/ConvertAppToJS.py', null);
        console.log(pythonApp);
        pythonApp = pythonApp.join('');
    }
    catch(e){
        console.log(`\n********************************************************
Error transpilation of App.py, enure the syntax is correct
Please ensure you have the following:
Python (www.python.org)
JavaScripthon (https://pypi.org/project/javascripthon/)
If you have pip installed simply run : pip install javascripthon
An App.py file created in your project directory
*******************************************************\n`);

            console.log(e.type);
            process.exit(-1);
    }

    try{
        // load the electron main.js template
        indexJSTree = JSON.parse(fs.readFileSync("./templates/blank.json", "utf-8"));

        // create the AST of the python code
        pythonAppTree = acorn.parse(pythonApp, {ecmaVersion : 2022});
        // parse the python AST
        pythonCodeParsed = parsePythonTree(pythonAppTree);
        // add the other code to the index.js file

        // add the date time
        addCommentsToEnd(indexJSTree, generateDateTime());
        
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

        // tries to get the html
        let res;
        try{
            res = await fetch(htmlAddress);
            if (res.status === 200)
                indexHTML = await res.text();
            else
                throw new Error(`Couldn't load HTML from ${htmlAddress}, please check the address supplied`);
        }
        catch(e){
            throw new Error(`Couldn't load HTML from ${htmlAddress}, please check the address supplied`);
        }
        

        // now parse through the html from the WebFlow app and check for fake-form=true
        //parse the HTML
        indexHTML = handleFakeForm(indexHTML);

        data.indexJS = newIndexJS.value;
        data.indexHTML = indexHTML;
        
        return data;

        // now try and send to the correct HTML file
        //fs.writeFileSync("./" + projectName + "/index.html", indexHTML);

        // write the JavaScript out
        //fs.writeFileSync("./" + projectName + "/index.js", newIndexJS.value);
    }
    catch (e){
        console.error(e.message);
        //console.error(e.name);
        process.exit(-1);
    }



    /*
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

            console.log(e.type);
            process.exit(-1);
        }
        

        console.log(results);
        let pythonApp = results.join('');

        // define all file variables
        
        

        try{
            
        }
        catch (e){
            
        }
    });

    */
    
}

main()