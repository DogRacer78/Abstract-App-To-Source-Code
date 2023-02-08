'''

def sub_start_hh_up():
    for i in range(10):
        print("STARTING")
    name = "Jack"
    if (name == "Jack"):
        x = 2
        x = x + 100
        print("Hello world")

    otherFunc("Hello from another function")

    testName = "Hello"
    print(len(testName))

    print("THIS IS AN INSERT")

    someOtherFunc()


def otherFunc(name):
    nums = []
    list(nums).append("This is in the array")
    print(nums[0])
    print(name)

def someOtherFunc():
    myList = []
    list(myList).append("Hello world")
    list(myList).append("Jack")
    list(myList).append("Ben")
    list(myList).append("James")

    for y in myList:
        print(y)

'''

def output_click_testBtn():
    # will console.log "hello world" to the console of the app
    print("Hello world")