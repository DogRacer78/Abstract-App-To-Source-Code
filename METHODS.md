# Abstract Commands
A simple guide to show the command that have been tested at current

## General Notes
All commands follow a similar syntax of *method-name_extra-info_id-of-element*
<br>
Within this command the _ are the limiting factor, they are used to split the data within a command.

## App File 
Your abstract-app app must be called App.py for the time being, if it is not it will be ignored. If no App.py is found an error will be
thrown

## HTML
The HTML must be created in <a href="https://www.webflow.com">Webflow</a> for now, sign up for a free account and keep a note of the published site URL. Any changes made in webflow must be published before they can be seen in your app.

### Using HTML
When using the HTML you must specify the id of any element you want to access in your App.py. Webflow does not support input fields that exist outside of a form. To fix this issue just add the attribute fake-form="true" to any form block you use in webflow.

## Events
Any event can be added to any element, as long as it is a valid JavaScript event that can be added to a DOM element. For example 'click'. To create a new event listener declare it as a new function in App.py, within the body of this function is the code that will be run when the event is fired.
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
Again here the **_** is **required** for the call to work. This function can be thought of as a call to a function, with its return value the value in the element it is binded to.

## Outputting data
Data can simply be output to a div element
<br>
<pre>setOutput_id-of-element(data)</pre>

## Comments
When generating code some comments will be added automatically. To add a comment manually use the syntax below:
<pre>__COMMENT__("This is my comment")</pre>
Note that these can not be used like normal comments, they can only be placed in places that a method call could be placed.
At this point in time they only support constant strings to be used as an argument, this means any other data types must be cast to string before being passed as a comment and string conatenations do not work either, strings must be formed in whole before being passed to a comment.

# MongoDB Integration
The tool supports the integration of MongoDB. There is some limitations to how it works.

## Connect to a Database
To connect to a database simply put the following anywhere in the python App:
```python
connectDB("address to database", "db name")
```
This means the app will attempt to connect to the database with the given address and name.

## Load Data
To load data from the database simply use the following:
```
dbLoadData("collection name", searchDict)
```
This method will return an array with data found using the searchDict. The search dictionary in python must be as follows:
```python
{ "title" : "Money" }
```
This is not an enforcement but it is best practice to do so, as attribute names that are not strings may cause unexpected behaviour.


# Using the Tool
To compile your python and webflow you have the following commands available:

- gen-web-app - creates a web app from App.py
- gen-electron-app - creates an electron app from App.py

To view the help for each command view run:<br>
<kbd>node ./Convert.js gen-web-app --help</kbd><br>
or<br>
<kbd>node ./Convert.js gen-electron-app --help</kbd>
<br>
To compile a web app run:<br>
<kbd>node ./Convert.js gen-web-app --name="name of app" --html_address="Address of your published webflow site"</kbd>
<br>
To compile to an electron app run:<br>
<kbd>node ./Convert.js gen-electron-app --name="name of app" --html_address="Address of your published webflow site"</kbd>

This is a cool change I made in linux
