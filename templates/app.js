// will contain a simple express server that connects to the mongodb server.js created from the same file
// to send data to the server we will use POST, will have a socket for the events to be called
// similar to the electron.js app

const express = require("express");
const path = require("path");
const { io } = require("socket.io-client");
const { Server } = require("socket.io");
const app = express();
const http = require("http");
const server = http.createServer(app);
const PORT = 80;

let connected = false;


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

const socket = io("http://localhost:3000");
const localSocketServer = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use("/static", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) =>{
    res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.post("/load_data", async (req, res) =>{
    console.log("POST load_data");
    // make a request to the socket.io server and get the correct data

    if (!connected)
        res.send("CONN_ERR");
    else{
        // if connected send a request for data
        const dataOut = await socket.emitWithAck(DataType.read, req.body);
        console.log(dataOut);
        res.send(dataOut);
    }
        
});

// on insert
app.post("/insert_data", async (req, res) => {
    console.log("POST insert_data");

    if (!connected)
        res.send("CONN_ERR");
    else{
        const info = await socket.emitWithAck(DataType.insert, req.body);
        res.send(info);
    }
});

// on updat
app.post("/update_data", async (req, res) => {
   console.log("POST update_data");

   if (!connected)
        res.send("CONN_ERR");
    else{
        const info = await socket.emitWithAck(DataType.update, req.body);
        res.send(info);
    }
});

app.post("/delete_data", async (req, res) => {
    console.log("POST delete_data");
    
    if (!connected)
        res.send("CONN_ERR");
    else{
        const info = await socket.emitWithAck(DataType.delete, req.body);
        res.send(info);
    }
});

server.listen(PORT, () =>{
    console.log(`Listening on port ${PORT}`);

    console.log("Trying to connect to socketIO...");
    socket.on("connect", () => {
        connected = true;
        console.log("Connected to DB");
    });

    socket.on("disconnect", () =>{
        connected = false;
        console.log("Lost connection to DB");
    });
    

    socket.on("insert_change", (data) => {
        console.log("Insert change");
        localSocketServer.emit("insert_change", data);
    });

    socket.on("delete_change", (data) => {
        console.log("Delete Change");
        localSocketServer.emit("delete_change", data);
    });

    socket.on("update_change", (data) => {
        console.log("update change");
        localSocketServer.emit("update_change", data);
    });
});