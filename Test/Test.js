// runs the tests
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "../Convert.js";
import { ASTToCode, codeToAST, visit } from "../src/NodeUtils.js";
import { parseElectronDBTree } from "../src/ParseDatabase.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);


// simple test case class to check if the test runs
class TestCase{
    constructor(id, name, expectedOut, test) {
        this.id = id;
        this.name = name;
        this.expectedOut = expectedOut;
        this.test = test;
    }

    async runTest(){
        writeOutput(`Running test ${this.id} (${this.name}):`);
        let testOut;

        try{
            testOut = await this.test();
        }
        catch(e){
            writeOutput(`\u274C ${this.id} (${JSON.stringify(this.expectedOut)}) failed:`);
            writeOutput("Error: " + e.name + ": " + e.message);
            return;
        }
        
        // reomve loc data
        this.testRes = removeLocData(testOut);
        if (JSON.stringify(testOut) === JSON.stringify(this.expectedOut)){
            writeOutput(`\u2705 ${this.id} (${this.name}) passed.`);
        }
        else{
            writeOutput(`\u274C ${this.id} (${this.name}) failed.`);
            writeOutput("Expected: ")
            writeOutput(JSON.stringify(this.expectedOut));
            writeOutput("Recieved: ");
            writeOutput(JSON.stringify(testOut));
        }
    }

    // runs a test that expects an exception to be thrown
    async testError(){
        writeOutput(`Running test ${this.id} (${this.name}):`);

        try{
            await this.test();
            writeOutput(`\u274C ${this.id} (${this.name}) failed`);
            writeOutput(`${this.id} (${this.name}) no expection thrown, where expected`);
        }
        catch(e){
            if (e.message === this.expectedOut){
                writeOutput(`\u2705 ${this.id} (${this.name}) passed`);
            }
            else{
                writeOutput(`\u274C ${this.id} (${this.name}) failed`);
                writeOutput(`${this.id} (${this.name}) generated exception ${e.name}: ${e.message}`);
            }
        }
    }

    debugTest(){
        writeOutput(`${this.id}, ${this.name}, ${this.expectedOut}`);
    }

    showResCodeOut(){
        if (this.testRes != null){
            return "Result:\n" + ASTToCode(this.testRes);
        }
    }

    showExpectedCodeOut(){
        if (this.expectedOut != null){
            return "Expected:\n" + ASTToCode(this.expectedOut);
        }
    }

}

let logStream;

function setup(){
    if (fs.existsSync("Test/Test_Out.log")){
        fs.unlinkSync("Test/Test_Out.log");
    }
    logStream = fs.createWriteStream("Test/Test_Out.log", {flags : "a"});
}

// helper methods
function removeLocData(tree){
    // removes the start and end from all parts of JSON
    visit(tree, (node, parent, key) => {
        try{
            delete node.start;
            delete node.end;
        }
        catch(e){

        }
    });
    return tree;
}

// writes a message to the log file
function writeOutput(message){
    logStream.write(message + "\n");
}

setup();


// test case 1
const testOne = new TestCase(1, "Adding event to element", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_1.json")))), 
async () => {
    // create the app
    const out = await createApp("TEST_1", "Test/TEST_PAGE.html", "Test/Test_1.py", true);
    return out.indexJS;
});

// test case 2
const testTwo = new TestCase(2, "Adding event with code in the method body", 
removeLocData(JSON.parse(fs.readFileSync("Test/Expected Out/Test_2.json"))),
async () => {
    // create the app
    const out = await createApp("TEST_2", "Test/TEST_PAGE.html", "Test/Test_2.py", true);
    return out.indexJS;
});

//test case 3
const testThree = new TestCase(3, "Adding event with id missing, (3 underscores)", 
removeLocData(JSON.parse(fs.readFileSync("Test/Expected Out/Test_3.json"))),
async () => {
    // create the app
    const out = await createApp("TEST_3", "Test/TEST_PAGE.html", "Test/Test_3.py", true);
    return out.indexJS;
});

// test case 4
const testFour = new TestCase(4, "Adding event with id missing (2 underscores)",
removeLocData(JSON.parse(fs.readFileSync("Test/Expected Out/Test_4.json"))),
async () => {
    // create the app
    const out = await createApp("TEST_4", "Test/TEST_PAGE.html", "Test/Test_4.py", true);
    return out.indexJS;
});

const testFive = new TestCase(5, "Adding event with no event specified", 
removeLocData(JSON.parse(fs.readFileSync("Test/Expected Out/Test_5.json"))),
async () => {
    // create the app
    const out = await createApp("TEST_5", "Test/TEST_PAGE.html", "Test/Test_5.py", true);
    return out.indexJS;
});

const testSix = new TestCase(6, "Adding event with no method name specified", 
removeLocData(JSON.parse(fs.readFileSync("Test/Expected Out/Test_6.json"))),
async () => {
    // create the app
    const out = await createApp("TEST_6", "Test/TEST_PAGE.html", "Test/Test_6.py", true);
    return out.indexJS;
});

// *********************** start_up tests *******************

const testSeven = new TestCase(7, "Adding a valid start_up", 
removeLocData(JSON.parse(fs.readFileSync("Test/Expected Out/Test_7.json"))),
async () => {
    // create the app
    const out = await createApp("TEST_7", "Test/TEST_PAGE.html", "Test/Test_7.py", true);
    return out.indexJS;
});

const testEight = new TestCase(8, "More than one start_up", 
JSON.parse(fs.readFileSync("Test/Expected Out/Test_8.json")).msg,
async () =>{
    // create the app
    const out = await createApp("TEST_8", "Test/TEST_PAGE.html", "Test/Test_8.py", true);
});

// ******************** get Value ********************

const testNine = new TestCase(9, "Valid getValue", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_9.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_9", "Test/TEST_PAGE.html", "Test/Test_9.py", true);
    return out.indexJS;
});

const testTen = new TestCase(10, "Valid getValue in method body of event", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_10.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_10", "Test/TEST_PAGE.html", "Test/Test_10.py", true);
    return out.indexJS;
});

const testsEleven = new TestCase(11, "getValue with no id (1 underscore)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_11.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_11", "Test/TEST_PAGE.html", "Test/Test_11.py", true);
    return out.indexJS;
});

const testTwelve = new TestCase(12, "getValue with args", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_12.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_12", "Test/TEST_PAGE.html", "Test/Test_12.py", true);
    return out.indexJS;
});

const test13 = new TestCase(13, "Valid setOutput String", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_13.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_13", "Test/TEST_PAGE.html", "Test/Test_13.py", true);
    return out.indexJS;
});

const test14 = new TestCase(14, "Valid setOutput Number", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_14.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_14", "Test/TEST_PAGE.html", "Test/Test_14.py", true);
    return out.indexJS;
});

const test15 = new TestCase(15, "Valid setOutput BigInt", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_15.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_15", "Test/TEST_PAGE.html", "Test/Test_15.py", true);
    return out.indexJS;
});

const test16 = new TestCase(16, "Valid setOutput Boolean", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_16.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_16", "Test/TEST_PAGE.html", "Test/Test_16.py", true);
    return out.indexJS;
});

const test17 = new TestCase(17, "Valid setOutput Null", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_17.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_17", "Test/TEST_PAGE.html", "Test/Test_17.py", true);
    return out.indexJS;
});

const test18 = new TestCase(18, "Valid setOutput Object", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_18.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_18", "Test/TEST_PAGE.html", "Test/Test_18.py", true);
    return out.indexJS;
});

const test19 = new TestCase(19, "SetOutput with no id supplied (1 underscore)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_19.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_19", "Test/TEST_PAGE.html", "Test/Test_19.py", true);
    return out.indexJS;
});

const test20 = new TestCase(20, "setOutput variable", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_20.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_20", "Test/TEST_PAGE.html", "Test/Test_20.py", true);
    return out.indexJS;
});

const test21 = new TestCase(21, "setOutput multiple args", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_21.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_21", "Test/TEST_PAGE.html", "Test/Test_21.py", true);
    return out.indexJS;
});

const test22 = new TestCase(22, "setOutput no args", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_22.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_22", "Test/TEST_PAGE.html", "Test/Test_22.py", true);
    return out.indexJS;
});

const test23 = new TestCase(23, "Valid comment", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_23.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_23", "Test/TEST_PAGE.html", "Test/Test_23.py", true);
    return out.indexJS;
});

const test24 = new TestCase(24, "Comment statement with no args", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_24.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_24", "Test/TEST_PAGE.html", "Test/Test_24.py", true);
    return out.indexJS;
});

const test25 = new TestCase(25, "Comment statement where the arg is not a literal", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_25.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_25", "Test/TEST_PAGE.html", "Test/Test_25.py", true);
    return out.indexJS;
});

const test26 = new TestCase(26, "Comment statement with more than one argument", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_26.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_26", "Test/TEST_PAGE.html", "Test/Test_26.py", true);
    return out.indexJS;
});

const test27 = new TestCase(27, "Load valid HTML from a local file", 
fs.readFileSync(path.join(__dirname, "/Expected Out/Test_27.html")).toString(),
async () => {
    // create the app
    const out = await createApp("TEST_27", "Test/Test_27.html", "Test/TEST_PYTHON.py", true);
    return out.indexHTML;
});

const test28 = new TestCase(28, "Load invalid HTML from a local file", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_28.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_27", "Test/Test_28.html", "Test/TEST_PYTHON.py", true);
    return out.indexHTML;
});

const test29FrontEnd = new TestCase(29, "Valid electron dbLoadData (Frontend)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_29FrontEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_29", "Test/TEST_PAGE.html", "Test/Test_29.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test29BackEnd = new TestCase(29, "Valid electron dbLoadData (Backend)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_29BackEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_29", "Test/TEST_PAGE.html", "Test/Test_29.py", true);
    let mainJSTreeBack = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTreeBack, true);
    return mainJSTreeBack;
});

const test30 = new TestCase(30, "Electron dbLoadData with no dbName specified", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_30.json"))).msg,
async () => {
    // create the app
    // create the app
    const out = await createApp("TEST_29", "Test/TEST_PAGE.html", "Test/Test_30.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test31 = new TestCase(31, "Electron dbLoadData with no dbName specified", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_31.json"))).msg,
async () => {
    // create the app
    // create the app
    const out = await createApp("TEST_29", "Test/TEST_PAGE.html", "Test/Test_31.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test32 = new TestCase(32, "Electron dbLoadData when no searchDict is provided", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_32.json"))).msg,
async () => {
    // create the app
    // create the app
    const out = await createApp("TEST_32", "Test/TEST_PAGE.html", "Test/Test_32.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test33 = new TestCase(33, "Electron dbLoadData when no searchDict is provided", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_33.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_33", "Test/TEST_PAGE.html", "Test/Test_33.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test34FrontEnd = new TestCase(34, "Valid electron dbInsertData (Front End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_34FrontEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_34", "Test/TEST_PAGE.html", "Test/Test_34.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test34BackEnd = new TestCase(34, "Valid electron dbInsertData (Back End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_34BackEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_34", "Test/TEST_PAGE.html", "Test/Test_34.py", true);
    let mainJSTreeBack = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTreeBack, true);
    return mainJSTreeBack;
});

const test35 = new TestCase(35, "Electron dbInsertData with no dbName specified", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_35.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_35", "Test/TEST_PAGE.html", "Test/Test_35.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test36 = new TestCase(36, "Electron dbInsertData with no collection specified", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_36.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_36", "Test/TEST_PAGE.html", "Test/Test_36.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test37 = new TestCase(37, "Electron dbInsertData when no insertData is provided", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_37.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_37", "Test/TEST_PAGE.html", "Test/Test_37.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test38 = new TestCase(38, "Electron dbInsertData when the insertData is not an object", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_38.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_38", "Test/TEST_PAGE.html", "Test/Test_38.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test39FrontEnd = new TestCase(39, "Valid electron dbDeleteData (Front End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_39FrontEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_39", "Test/TEST_PAGE.html", "Test/Test_39.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test39BackEnd = new TestCase(39, "Valid electron dbDeleteData (Back End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_39BackEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_39", "Test/TEST_PAGE.html", "Test/Test_39.py", true);
    let mainJSTreeBack = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTreeBack, true);
    return mainJSTreeBack;
});

const test40 = new TestCase(40, "Electron dbDeleteData with no dbName specified", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_40.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_40", "Test/TEST_PAGE.html", "Test/Test_40.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test41 = new TestCase(41, "Electron dbDeleteData with no collection specified", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_41.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_41", "Test/TEST_PAGE.html", "Test/Test_41.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test42 = new TestCase(42, "Electron dbDeleteData when no filter is provided", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_42.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_42", "Test/TEST_PAGE.html", "Test/Test_42.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test43 = new TestCase(43, "Electron dbDeleteData when the filter is not an object", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_43.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_43", "Test/TEST_PAGE.html", "Test/Test_43.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test44FrontEnd = new TestCase(44, "Valid electron dbUpdateData (Front End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_44FrontEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_44", "Test/TEST_PAGE.html", "Test/Test_44.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test44BackEnd = new TestCase(44, "Valid electron dbUpdateData (Back End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_44BackEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_44", "Test/TEST_PAGE.html", "Test/Test_44.py", true);
    let mainJSTreeBack = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTreeBack, true);
    return mainJSTreeBack;
});

const test45 = new TestCase(45, "Electron dbUpdateData with no dbName specified", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_45.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_45", "Test/TEST_PAGE.html", "Test/Test_45.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test46 = new TestCase(46, "Electron dbUpdateData with no collection specified", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_46.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_46", "Test/TEST_PAGE.html", "Test/Test_46.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test47 = new TestCase(47, "Electron dbUpdateData when no filter is provided", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_47.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_47", "Test/TEST_PAGE.html", "Test/Test_47.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test48 = new TestCase(48, "Electron dbUpdateData when the filter is not an object", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_48.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_48", "Test/TEST_PAGE.html", "Test/Test_48.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test49 = new TestCase(49, "Electron dbUpdateData when no update object is provided", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_49.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_49", "Test/TEST_PAGE.html", "Test/Test_49.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test50 = new TestCase(50, "Electron dbUpdateData when update object is not an object", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_50.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_50", "Test/TEST_PAGE.html", "Test/Test_50.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test51FrontEnd = new TestCase(51, "Electron, valid insertChange (Front End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_51FrontEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_51", "Test/TEST_PAGE.html", "Test/Test_51.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test51BackEnd = new TestCase(51, "Electron, valid insertChange (Back End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_51BackEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_51", "Test/TEST_PAGE.html", "Test/Test_51.py", true);
    let mainJSTreeBack = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTreeBack, true);
    return mainJSTreeBack;
});

const test52 = new TestCase(52, "Electron 1+ insertChange", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_52.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_50", "Test/TEST_PAGE.html", "Test/Test_52.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test53FrontEnd = new TestCase(53, "Electron, valid updateChange (Front End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_53FrontEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_53", "Test/TEST_PAGE.html", "Test/Test_53.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test53BackEnd = new TestCase(53, "Electron, valid updateChange (Back End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_53BackEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_53", "Test/TEST_PAGE.html", "Test/Test_53.py", true);
    let mainJSTreeBack = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTreeBack, true);
    return mainJSTreeBack;
});

const test54 = new TestCase(54, "Electron 1+ updateChange", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_54.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_54", "Test/TEST_PAGE.html", "Test/Test_54.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test55FrontEnd = new TestCase(55, "Electron, valid deleteChange (Front End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_55FrontEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_55", "Test/TEST_PAGE.html", "Test/Test_55.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

const test55BackEnd = new TestCase(55, "Electron, valid deleteChange (Back End)", 
removeLocData(JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_55BackEnd.json")))),
async () => {
    // create the app
    const out = await createApp("TEST_55", "Test/TEST_PAGE.html", "Test/Test_55.py", true);
    let mainJSTreeBack = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTreeBack, true);
    return mainJSTreeBack;
});

const test56 = new TestCase(56, "Electron 1+ deleteChange", 
JSON.parse(fs.readFileSync(path.join(__dirname, "/Expected Out/Test_56.json"))).msg,
async () => {
    // create the app
    const out = await createApp("TEST_56", "Test/TEST_PAGE.html", "Test/Test_56.py", true);
    let mainJSTree = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/mainJS.json"), "utf-8"));
    parseElectronDBTree(out.indexJS, mainJSTree, true);
    return out.indexJS;
});

// run test 1
await testOne.runTest();
writeOutput("\n");
// run test 2
await testTwo.runTest();
writeOutput("\n");
// run test 3
await testThree.runTest();
writeOutput("\n");
// run test 4
await testFour.runTest();
writeOutput("\n");
// run test 5
await testFive.runTest();
writeOutput("\n");
// run test 6
await testSix.runTest();
writeOutput("\n");
// run test 7
await testSeven.runTest();
writeOutput("\n");
// run test 8
testEight.debugTest();
await testEight.testError();
writeOutput("\n");
// run test 9
await testNine.runTest();
//writeOutput(testNine.showResCodeOut());
//writeOutput(testNine.showExpectedCodeOut());
writeOutput("\n");
// run test 10
await testTen.runTest();
writeOutput("\n");
// run test 11
await testsEleven.runTest();
writeOutput(testsEleven.showResCodeOut());
writeOutput(testsEleven.showExpectedCodeOut());
writeOutput("\n");
// run test 12
await testTwelve.runTest();
writeOutput(testTwelve.showResCodeOut());
writeOutput(testTwelve.showExpectedCodeOut());
writeOutput("\n");
// run test 13
await test13.runTest();
writeOutput("\n");
// run test 14
await test14.runTest();
writeOutput("\n");
// run test 15
await test15.runTest();
writeOutput(test15.showResCodeOut());
writeOutput(test15.showExpectedCodeOut());
writeOutput("\n");
// run test 16
await test16.runTest();
writeOutput("\n");
// run test 17
await test17.runTest();
writeOutput("\n");
// run test 18
await test18.runTest();
writeOutput("\n");
// run test 19
await test19.runTest();
writeOutput(test19.showResCodeOut());
writeOutput(test19.showExpectedCodeOut());
writeOutput("\n");
// run test 20
await test20.runTest();
writeOutput("\n");
// run test 21
await test21.runTest();
writeOutput("\n");
// run test 22
await test22.testError();
writeOutput("\n");
// run test 23
await test23.runTest();
writeOutput("\n");
// run test 24
await test24.testError();
writeOutput("\n");
// run test 25
await test25.testError();
writeOutput("\n");
// run test 26
await test26.testError();
writeOutput("\n");
// run test 27
await test27.runTest();
writeOutput("\n");
// run test 28
await test28.testError();
writeOutput("\n");
// run test 29
await test29FrontEnd.runTest();
writeOutput("\n");
// run test 29 back end
await test29BackEnd.runTest();
//writeOutput(test29BackEnd.showExpectedCodeOut());
//writeOutput(test29BackEnd.showResCodeOut());
writeOutput("\n");
// run test 30
await test30.testError();
writeOutput("\n");
// run test 31
await test31.testError();
writeOutput("\n");
// run test 32
await test32.testError();
writeOutput("\n");
// run test 33
await test33.testError();
writeOutput("\n");
// run test 34 back end
await test34BackEnd.runTest();
writeOutput("\n");
// run test 34 front end
await test34FrontEnd.runTest();
//writeOutput(test34FrontEnd.showExpectedCodeOut());
writeOutput("\n");
// run test 35
await test35.testError();
writeOutput("\n");
// run test 36
await test36.testError();
writeOutput("\n");
// run test 37
await test37.testError();
writeOutput("\n");
// run test 38
await test38.testError();
writeOutput("\n");
// run test 39 back end
await test39BackEnd.runTest();
//writeOutput(test39BackEnd.showExpectedCodeOut());
//writeOutput(test39BackEnd.showResCodeOut());
writeOutput("\n");
// run test 39 front end
await test39FrontEnd.runTest();
writeOutput("\n");
// run test 40
await test40.testError();
writeOutput("\n");
// run test 41
await test41.testError();
writeOutput("\n");
// run test 42
await test42.testError();
writeOutput("\n");
// run test 43
await test43.testError();
writeOutput("\n");
// run test 44 front end
await test44FrontEnd.runTest();
writeOutput("\n");
// run test 44 back end
await test44BackEnd.runTest();
writeOutput("\n");
// run test 45
await test45.testError();
writeOutput("\n");
// run test 46
await test46.testError();
writeOutput("\n");
// run test 47
await test47.testError();
writeOutput("\n");
// run test 48
await test48.testError();
writeOutput("\n");
// run test 49
await test49.testError();
writeOutput("\n");
// run test 50
await test50.testError();
writeOutput("\n");
// run test 51 front end
await test51FrontEnd.runTest();
writeOutput("\n");
// run test 51 back end
await test51BackEnd.runTest();
writeOutput("\n");
// run test 52
await test52.testError();
writeOutput("\n");
// run test 53 front end
await test53FrontEnd.runTest();
writeOutput("\n");
// run test 53 back end
await test53BackEnd.runTest();
writeOutput("\n");
// run test 54
await test54.testError();
writeOutput("\n");
// run test 55 front end
await test55FrontEnd.runTest();
writeOutput("\n");
// run test 55 back end
await test55BackEnd.runTest();
writeOutput("\n");
// run test 56
await test56.testError();
//writeOutput(test56.expectedOut);
//writeOutput(test56.testRes);
writeOutput("\n");


// end of tests
console.log("*********************");
console.log("****ALL TESTS RUN****");
console.log("Check log for results");
console.log("*********************");