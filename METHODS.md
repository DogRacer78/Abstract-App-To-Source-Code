# Abstract Commands
A simple guide to show the command that have been tested at current

## General Notes
All commands follow a similar syntax of *method-name_extra-info_id-of-element*
<br>
Within this command the _ are the limiting factor, they are used to split the data within a command.

## Installation
As the tool is written in JavaScript is requires node.js to be installed on your machine. To install node.js go to <a href="https://nodejs.org/en/">nodejs.org</a> and download the latest version for your machine.

To install the tool download the package from <a href="https://www.npmjs.com/package/abstract-app-to-source">npm</a> by running the following command:
```bash
npm i abstract-app-to-source
```
I recommend installing the package globally so you can use the tool from anywhere:
```bash
npm i abstract-app-to-source -g
```

The package requires that you have python installed on your machine. If you do not have python installed you can download it from <a href="https://www.python.org/downloads/">here</a>.

Once you have python installed you will need to install the <a href="https://github.com/metapensiero/metapensiero.pj" target="_blank">JavaScripthon</a> package. To do this run the following command:
```bash
pip install javascripthon
```

## App File 
The framework uses python with some differences as its main language. When creating an app it must be a python file with the .py extension. The app must follow the syntax set out in the <a href="https://github.com/metapensiero/metapensiero.pj">JavaScripthon</a> documentation. This is because this library is used to convert from python to JavaScript and the syntax of some common python functions are slightly different. An example is lists.

## HTML
HTML can be created in <a href="https://www.webflow.com">Webflow</a> or locally. If you are using Webflow sign up for a free account and keep a note of the published site URL. Any changes made in webflow must be published before they can be seen in your app. If you are using a local HTML file you just need the path to the file. The HTML address or path is passed into the `html_address` parameter when generating the app.

### Using HTML
When using the HTML you must specify the id of any element you want to access in your app. Webflow does not support input fields that exist outside of a form. To fix this issue just add the attribute fake-form="true" to any form block you use in webflow.

## Events
Any event can be added to any element, as long as it is a valid JavaScript event that can be added to a DOM element. For example 'click'. To create a new event listener declare it as a new function in your app, within the body of this function is the code that will be run when the event is fired.
<br>
### Tested Events
The events below have been tested and are confirmed to work on any HTML element that will support it:
<br>
| Event | Example |
| ----- | ------- |
| click | <pre>def myEvent_click_idOfMyElement():<br>   #code to run on event fire</pre>

### Special Events
Some events are special and cannot be added to elements below is a list of tested events that are special:
<br>
| Event | Description | Example |
| ----- | ----------- | ------- |
| Start up/Load | Equivalent to document.onLoad() | <pre>def start_up():<br>    # code to run on start up</pre>


## Getting data
To get data from any element that supports the .value attribute can be seen below
```python
getValue_id-of-element()
```
Again here the **_** is **required** for the call to work. This function can be thought of as a call to a function, with its return value the value in the element it is linked to.

## Outputting data
Data can simply be output to a div element
<br>
<pre>setOutput_id-of-element(data)</pre>

## Comments
When generating code some comments will be added automatically. To add a comment manually use the syntax below:
<pre>__COMMENT__("This is my comment")</pre>
Note that these can not be used like normal comments, they can only be placed in places that a method call could be placed.
At this point in time they only support constant strings to be used as an argument, this means any other data types must be cast to string before being passed as a comment and string concatenations do not work either, strings must be formed in whole before being passed to a comment.

# MongoDB Integration
The tool supports the integration of MongoDB. There is some limitations to how it works.

## Server.js
To make the process of setting up a database easier, the tool will generate a server that can be run. This will automatically spawn a new MongoDB instance. Any tools generated using the tool will try to connect to a server running on localhost:3000.

### Creating the server
To create the server simply run the command as follows.<br>
<kbd>npx abstract-app gen-db --location "./Your location"</kbd><br>
This will generate a server.js file, an instance of the MongoDB executable, a database folder (will be empty) and a script to launch the server. If a folder already exists at the path entered a dialogue will appear asking if it is ok to proceed. To launch the server.js simply click the RUN_SERVER.bat file.

## Connect to a Database
Connecting to a MongoDB database run from a server.js file will be done automatically, if the application is running on the same PC as the server.

## Load Data
To load data from the database simply use the following:
```python
dbLoadData("DB name" "collection name", searchDict)
```
This method will return an array with data found using the searchDict. The search dictionary in python must be as follows:
```python
{ "title" : "Money" }
```
This is not an enforcement but it is best practice to do so, as attribute names that are not strings may cause unexpected behaviour.

If there is a connection error, an error string will be returned instead, in the format
```python
"CONN_ERR"
```

It is good practice to check that any database operation does not equal this to stop unexpected behaviour.

## Insert Data
To insert data the following can be used
```python
dbInsertData("DB Name", "Collection Name", insertData)
```

When inserting data it must be provided as a python dictionary, similar to above, for example to insert a new song with the title and artist is below:
```python
dbInsertData("Songs", "song", { "Title" : "Thunder Road", "Artist" : "Bruce Springsteen" })
```

Again if there is an error `"CONN_ERR"`, will be returned. If there is no error a dictionary will be returned with some information about the operation.

## Updating Data
To update data the following can be used:
```python
dbUpdateData("DB Name", "Collection Name", filter, update);
```
To update data within a MongoDB we must provide a filter dictionary to tell it what to update, the update dictionary will contain the actual data to use.

An example of this can be seen below.

If we want to update the data with a certain Title we can do the following:
```python
dbUpdateData("Songs", "songs", { "Title" : "Thunder Road" }, { "Artist" : "Daft Punk" })
```
We are changing the artist of the song with the title `"Thunder Road"` to `"Daft Punk"`.

Again like above the string `"CONN_ERR"` will be returned if an error occurs. If the operation is successful, then a dictionary will be returned with data about the operation.

### Notes on Update
When using the update method there is some limitations to keep in mind.
- Only the first record found will be updated
- If a record is not found using the filter, a new record will not be created

## Deleting Data
Deleting data works in a similar way to update as a filter must be supplied.
```python
dbDeleteData("DB Name", "Collection Name", filter)
```
Here the filter is a dictionary to specify what is to be deleted.

```python
dbDeleteData("Songs", "songs", { "Title" : "Thunder Road" })
```
Here we can see that we will delete a record with the title `"Thunder Road"`. Similarly to update this will only delete the first record found using the filter.

Again like above `"CONN_ERR"` will be returned if an error occurs. If it succeeds, then a dictionary will be returned with data about the operation.

## Change Events
Some operations can emit events when they occur, these can be listened for and actions taken. As a MongoDB server can support multiple databases, the code generated has no way to tell the what database the event comes from. For now it is advised to just use one database.

### Insert
To listen for an insert event:
```python
def insertChange():
    # code to be run when an insert is detected
```

### Update
To listen for an update event:
```python
def updateChange():
    # code to be run when an update is detected
```

### Delete
To listen for a delete event:
```python
def deleteChange():
    # code to be run when a delete is detected
```

# Using the Tool
## Generating Apps
To compile your python and HTML you have the following commands available:

- gen-web-app - creates a web app
- gen-electron-app - creates an electron app

The arguments of both commands are as follows:
- name - The name of the directory to put the app into
- app_path - Path to the python App to use as a templates, can be called anything
- html_address - A hyperlink to a webflow site, or a local html file can be used

To view the help for each command view run:<br>
<kbd>npx abstract-app gen-web-app --help</kbd><br>
or<br>
<kbd>npx abstract-app gen-electron-app --help</kbd>
<br>
To compile a web app run:<br>
<kbd>npx abstract-app gen-web-app --name "name of app" --html_address "HTML address or hyperlink" --app_path "Path to python app"</kbd>
<br>
To compile to an electron app run:<br>
<kbd>npx abstract-app gen-electron-app --name "name of app" --html_address "HTML address or hyperlink" --app_path "Path to python app"</kbd>

## Generating a Database Server
To generate a database server we can run the command:<br>
<kbd>npx abstract-app gen-db --location "Path to folder"</kbd><br>
Then to run the server we can run the RUN_SERVER.bat file.

## Web apps
Once you have generated a web app to run the app use the following command:<br>
<kbd>node ./app.js</kbd><br>
This will start the server, open a browser and navigate to `localhost:80`

## Electron apps
Once you have generated an electron app to run the app use the following command:<br>
<kbd>npm start</kbd><br>
This will open a new window with the app running.
