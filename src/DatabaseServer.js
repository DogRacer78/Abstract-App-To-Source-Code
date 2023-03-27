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
import https from "https";
import { exec } from "child_process";
import { chdir, stderr, stdout } from "process";

/**
 * Copies the server.js file to the correct dir
 * @param {String} dirToCopyTo The dir to copy the server.js file to
 * @param {String} __dirname Local dir of the tool
 */
function copyServerJS(dirToCopyTo, __dirname){
    // if any dir exists here delete
    // ask the user if this is ok
    if (fs.existsSync(dirToCopyTo)){
        let answer = "";
        const prompt = promptSync();
        do {
            answer = prompt(`A folder has been found at ${dirToCopyTo}, to proceed it must be deleted, do you wish to proceed (y/n) >> `);
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
    fs.mkdirSync(dirToCopyTo);
    console.log(`Created ${dirToCopyTo}`);
    // create the database dir
    fs.mkdirSync(path.join(dirToCopyTo, "/database"));
    console.log(`Created ${path.join(dirToCopyTo, "/database")}`);

    fs.mkdirSync(path.join(dirToCopyTo, "/bin"));
    console.log(`Created /bin`);

    // https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.5.zip
    fs.copyFileSync(path.join(__dirname, "./templates/mongod/mongod.exe"), path.join(dirToCopyTo, "/bin/mongod.exe"));
    console.log(`Copied mongod.exe to ${path.join(dirToCopyTo, "/bin/mongod.exe")}`);

    // load the server.js file
    fs.copyFileSync(path.join(__dirname, "/templates/server.js"), path.join(dirToCopyTo, "server.js"));
    console.log("Created server.js");
    
    // create the shell scripts
    createShell(dirToCopyTo);
    console.log("Created shell command");
    createBAT(dirToCopyTo);
    console.log("Created BAT command");

    console.log("Installing required packages...");

    chdir(path.join(dirToCopyTo, "/"));
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