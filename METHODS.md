# Abstract Commands
A simple guide to show the command that have been tested at current

## General Notes
All commands follow a similar syntax of *method-name_extra-info_id-of-element*
<br>
Within this command the _ are the limiting factor, they are used to split the data within a command.

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
<pre>getValue_id-of-element()</pre>
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
