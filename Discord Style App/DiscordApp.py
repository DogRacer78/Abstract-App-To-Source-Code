# a discord style messaging app to showcase the tool

'''
db strcuture
db Names : "Discord"
collection name : "messages"
{
    "sender" : "name",
    "msg" : "message data"
}

'''

NOT_CONNECTED_MSG = "Not connected to the database server"

messages = []

def createMessagesString():
    messageString = ""
    for message in messages:
        messageString += message.sender + ": " + message.msg + "\n"
    return messageString

def checkWhitespace(data):
    if len(data) == 0:
        return True
    
    for letter in data:
        if letter != " ":
            return False
    
    return True

# on start up we will load all the messages
def start_up():
    __COMMENT__("Set error text to none")
    setOutput_errorTxt("")

    __COMMENT__("Load all the messages in the database")

    allMessages = dbLoadData("Discord", "messages", {})
    output = ""
    
    if allMessages == "CONN_ERR":
        output = NOT_CONNECTED_MSG
    else:
        __COMMENT__("Loop through all the messages and add them to the messages array")
        
        for message in allMessages:
            list(messages).append(message)

        __COMMENT__("Get all the messages")
        output = createMessagesString()

    setOutput_msgTxt(output);

def sendMessage_click_sendMsgBtn():
    __COMMENT__("Get the name and message data\nCheck if they are not empty")

    nameValue = getValue_nameInput()
    msgContent = getValue_msgInput()

    output = ""

    if (checkWhitespace(nameValue) or checkWhitespace(msgContent)):
        output = "Please enter a name and message"
        setOutput_errorTxt(output)
    else:
        __COMMENT__("Send to the database")
        dbInsertData("Discord", "messages", { "sender" : nameValue, "msg" : msgContent })
        setOutput_errorTxt(output)

def insertChange():
    __COMMENT__("Upon insert update the messages")
    print("Detected an output")
    messages = dbLoadData("Discord", "messages", {})
    output = createMessagesString()
    setOutput_msgTxt(output)
