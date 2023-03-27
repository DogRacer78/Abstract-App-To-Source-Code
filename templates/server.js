// this connects to the mongodb
const { MongoClient } = require("mongodb");
const { exec } = require("child_process");
const { Server } = require("socket.io");

function BufferData(databaseName, collectionName, data, type) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.data = data;
    this.type = type;
}
  
const DataType = {
    insert : "insert",
    update : "update",
    delete : "delete",
    read : "read"
};


let client;

/**@type {MongoClient} */
let conn;

// socket io
const io = new Server(3000);

const DB_ADDRESS = "mongodb://127.0.0.1:27017";
const DB_PATH = "";

// for now it will just connect to the mongodb locally

// opens a socket to any application that wants to connect to it

// start database here
function startDB(){
    // spawn a new process that will 
    const mongoDBProcces = exec('"./bin/mongod.exe" --dbpath "./database/', {shell : true});

    mongoDBProcces.stdout.on("data", (data) =>{
        console.log(data);
    });

    mongoDBProcces.stderr.on("data", (data) => {
        throw new Error(data);
    });
}


async function connectToDB(){
    // connects to the DB
    try{
        // try to connect to the db
        console.log("Connecting...");
        client = new MongoClient(DB_ADDRESS);
        conn = await client.connect();
        console.log("Connected!!!");
        console.log(await conn.db("Songs").collection("songs").find({}).toArray());
        return true;
    }
    catch(e){
        console.log(e.name);
        return false;
    }
}

async function main(){
    startDB();
    console.log("DB STARTED");
    const res = await connectToDB();
    if (res){
        console.log("Connected to DB");
    }
    else{
        console.log("Failed to connect");
        return;
    }

    console.log("Setting up SocketIO...");

    // create the socket
    io.on("connection", (socket) =>{
        console.log("Someone connected");
        // send the database names to them
        conn.db().admin().listDatabases().then((dbs) =>{
            console.log(dbs);
            //socket.send("list-db", );
        });
        

        socket.on("insert", async (data, ack) => {
            // get the data from the 
            console.log("Recived data on insert");
            // load the data into database
            await conn.db(data.databaseName).collection(data.collectionName).insertOne(data.data);
            ack(200);

            // notifies that a change was made
            socket.emit("insert_change", data);
        });

        socket.on("update", async (data) => {
            // updates the database
            await conn.db(data.databaseName).collection(data.collectionName).updateOne(
                data.data.filter, 
                { $set : data.data.updateData}, 
                { upsert : false }
            );

            // notify of a change in update
            io.emit("update_change", data);
        });

        socket.on("delete", async (data) => {
            await conn.db(data.databaseName).collection(data.collectionName).deleteOne(data.data);

            // notify of delete change
            socket.emit("delete_change", data);
        });

        socket.on("read", async (data, ack) => {
            // loads the data from the database and returns it to the server
            let res = await conn.db(data.databaseName).collection(data.collectionName).find(data.data).toArray();
            ack(res);
        });
    });

}

main();