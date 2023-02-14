def start_up():
    for i in range(10):
        print("STARTING\n\n")
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


def output_click_testBtn():
    # will convert from celcius to farenheit
    __COMMENT__("This function will take input from the input withid of 'testInput' and will print a fahrenheit version of the temperature to the console will also contain error checking")
    celcius = getValue_testInput()
    if (celcius != ""):
        celcius = int(celcius)
        fahrenheit = (celcius * 9 / 5) + 32
        print(str(fahrenheit) + "f")
    else:
        print("You need to enter a number")


def testClickOfInput_click_testInput():
    #num = getValue_testInput()
    print("The value in the input is as below")
    #print(getValue_testInput())
    __COMMENT__("THIS IS MY TEST COMMENT I ADDED IN PYTHON")