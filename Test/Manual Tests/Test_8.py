myCoolData = None

def start_up():
    print("Starting the Song Selection App")


def getSong_click_loadDataBtn():
    __COMMENT__("Loads the song with the name")
    songTitle = getValue_songName()
    if (songTitle != ""):
        myCoolData = dbLoadData("Songs", "songs", {"title" : songTitle})
        if (myCoolData != "CONN_ERR"):
            __COMMENT__("Set the output")
            output = ""

            __COMMENT__("Check if the output is empty")
            if (len(myCoolData) == 0):
                output = "No song with the title " + songTitle
            else:
                output = myCoolData[0].title + " by " + myCoolData[0].artist

            setOutput_dbOutTxt(output)
        else:
            setOutput_dbOutTxt("DB Not Connected")
            return


def updateSong_click_updateSongBtn():
    # update a song
    songTitle = getValue_updateSongName()
    newArtist = getValue_updateArtistTxt()
    if (songTitle != "" and newArtist != ""):
        res = dbUpdateData("Songs", "songs", {"title" : songTitle}, {"artist" : newArtist})
        if (res != "CONN_ERR"):
            setOutput_dbOutTxt(res)
            print(res)
        else:
            setOutput_dbOutTxt("DB Not connected")
    else:
        setOutput_dbOutTxt("Please provide some data")

def updateSong_click_addSongBtn():
    title = getValue_addSongName()
    if (title != ""):
        res = dbInsertData("Songs", "songs", {"title" : title, "artist" : "Eagles"})
        if (res != "CONN_ERR"):
            setOutput_dbOutTxt(res)
        else:
            setOutput_dbOutTxt("DB Not connected")
    else:
        print("No such song with title " + title)

def deleteSong_click_deleteSongBtn():
    songTitle = getValue_deleteSongName()
    if (songTitle != ""):
        res = dbDeleteData("Songs", "songs", {"title" : songTitle})
        if (res != "CONN_ERR"):
            setOutput_dbOutTxt(res)
        else:
            setOutput_dbOutTxt("DB Not connected")

def getAllSongs_click_showAllBtn():
    allData = dbLoadData("Songs", "songs", {})
    if (allData != "CONN_ERR"):
        output = ""
        for record in allData:
            output += record.title + " by " + record.artist + "\n"
    else:
        output = "DB Not Connected"

    setOutput_dbOutTxt(output)

def updateChange():
    # will be called when an update change is detected
    setOutput_changeEventsTxt("Update change was detected")

def insertChange():
    # called when an insert is detected
    setOutput_changeEventsTxt("Insert change was detected")

def deleteChange():
    setOutput_changeEventsTxt("Delete change was detected")