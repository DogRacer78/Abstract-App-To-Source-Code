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

            console.log(e.type);
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
            fs.writeFileSync("./" + projectName + "/index.js", newIndexJS.value);

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

            // now try and send to the correct HTML file
            fs.writeFileSync("./" + projectName + "/index.html", indexHTML);


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
            //console.error(e.name);
        }
    });
    
}

main()