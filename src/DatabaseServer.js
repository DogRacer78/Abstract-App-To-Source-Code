// creates a socket.io server that will start the mongodb database and allow connections to it via socket.io
// also controls how the web app talks to the server
// each electron app will not interface with the database directly

// electron app will use a socket to push data to the master server when it is stored on its local storage

// get the server.js template file and copy it to the desired directory
// using .js files instead of .json to preserve the comments put into the server.js during development

import { dir } from "console";
import fs from "fs";
import path from "path";
import promptSync from 'prompt-sync';
import { exec } from "child_process";
import { chdir, stderr, stdout } from "process";

// for trying to download the exe
// will leave here for now in case I want to go back to it later
/*
import https from "https";
import http from "http";
import { unzip } from "zlib";
import AdmZip from "adm-zip";
import progress from "progress-stream";
import request from "request";
*/

/**
 * Copies the server.js file to the correct dir
 * @param {String} dirToCopyTo The dir to copy the server.js file to
 * @param {String} __dirname Local dir of the tool
 */
function copyServerJS(dirToCopyTo, __dirname){
    // server dir to copy to normalised
    const serverDir = path.join("./", dirToCopyTo);

    // if any dir exists here delete
    // ask the user if this is ok
    if (fs.existsSync(serverDir)){
        let answer = "";
        const prompt = promptSync();
        do {
            answer = prompt(`A folder has been found at ${serverDir}, to proceed it must be deleted, do you wish to proceed (y/n) >> `);
            answer = answer.toLowerCase();
        } while (answer !== "y" && answer !== "n");
        
        if (answer === "y"){
            console.log("Ok deleting");
            fs.rmSync(dirToCopyTo, { recursive: true, force: true });
        }
        else if (answer === "n"){
            console.log("Ok, not creating the database");
            return;
        }
    }

    // create the dir
    fs.mkdirSync(serverDir);
    console.log(`Created ${serverDir}`);
    // create the database dir
    fs.mkdirSync(path.join(serverDir, "/database"));
    console.log(`Created ${path.join(serverDir, "/database")}`);

    fs.mkdirSync(path.join(serverDir, "/bin"));
    console.log(`Created /bin`);

    // https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.5.zip
    fs.copyFileSync(path.join(__dirname, "./templates/mongod/mongod.exe"), path.join(serverDir, "/bin/mongod.exe"));
    console.log(`Copied mongod.exe to ${path.join(serverDir, "/bin/mongod.exe")}`);

    // load the server.js file
    fs.copyFileSync(path.join(__dirname, "/templates/server.js"), path.join(serverDir, "server.js"));
    console.log("Created server.js");
    
    // create the shell scripts
    //createShell(serverDir);
    //console.log("Created shell command");
    createBAT(serverDir);
    console.log("Created BAT command");

    // tried to download it but could not get it working
    // so instead just using the old method of copying
    // will keep this here in case I want to go back to it
    /*
    // download the package
    const tempZipDir = path.join(dirToCopyTo, "/tempZip.zip");
    const file = fs.createWriteStream(tempZipDir);
    let str = progress({
        drain : true,
        time : 100,
        speed : 20,
    });

    console.log("Trying to get length of file");
    // get the length of the file
    request("https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.5.zip", {method : "HEAD"}, (err, res, body) =>{
        console.log("Got response");
        str.setLength(res.headers["content-length"]);
    });

    str.on("progress", (progress) =>{
        process.stdout.write(`Downloading: ${Math.floor(progress.percentage).toString()}%\r`);
    });

    
    console.log("Downloading mongod.exe");
    https.get("https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.5.zip", (res) => {
        res.pipe(str).pipe(file);

        file.on("finish", () => {
            console.log("Finished downloading ZIP");
            file.close();
            const zip = new AdmZip(tempZipDir);
            console.log("Finished downloading");
            fs.mkdirSync(path.join(dirToCopyTo, "/zip_contents"));
            zip.extractEntryToS(path.join("mongodb-win32-x86_64-windows-6.0.5/", "bin/mongod.exe"), path.join(dirToCopyTo, "/bin"));
            console.log("Finsihed unzipping");
        });
        
    });
    */

    console.log("Installing required packages...");

    chdir(path.join(serverDir, "/"));
    const packageTask = exec("npm install mongodb && npm install socket.io", (err, stdout, stderr) =>{
        console.log("Finished downloading packages");
    });

    packageTask.stdout.on("data", (msg) =>{
        console.log(msg);
    });

    packageTask.stderr.on("error", (err) =>{
        console.log(err);
        process.exit(-1);
    });

}

/**
 * Creates a shell program to run the server on linux/Mac environments
 * @param {String} dir The dir to copy the script to
 */
function createShell(dir){
    let shellProgram = 'node ./server.js';
    fs.writeFileSync(path.join(dir, "RUN_SERVER.sh") , shellProgram);
}

/**
 * Creates a BAT file to run the server on windows
 * @param {String} dir The dir to copy the script to
 */
function createBAT(dir){
    let BATProgram = 'node server.js';
    fs.writeFileSync(path.join(dir, "RUN_SERVER.bat"), BATProgram);
}

export {copyServerJS};