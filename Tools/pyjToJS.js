// a simple command line tool to convert .pyj files to .js files

import * as fs from "fs";
import * as rapydscript from "rapydscript";
import * as acorn from "acorn";
import {toJs} from "estree-util-to-js";

function main(){
    // source and destination paths of files
    let srcPath = process.argv[2];
    let destPath = process.argv[3];

    if (srcPath == null || destPath == null){
        console.error("Invalid file path provided")
        return;
    }

    // try to open the pyj file
    let srcFile;
    try{
        srcFile = fs.readFileSync(srcPath, "utf-8");
    }
    catch{
        console.error("Invalid path to source file")
        return;
    }

    // attempt to convert the file
    let convertedSrc;
    try{
        convertedSrc = rapydscript.compile(srcFile, {});
    }
    catch (e){
        console.log("Error", e.stack);
        console.log("Error", e.name);
        console.log("Error", e.message);
        console.error("Problem converting file, check your pyj has good syntax");
        return;
    }

    // now write out to file
    let AST = acorn.parse(convertedSrc, {ecmaVersion : 2022});
    let jsSrc = toJs(AST);
    fs.writeFileSync(destPath, jsSrc.value);
    console.log("Created file at : " + destPath);
}

main();