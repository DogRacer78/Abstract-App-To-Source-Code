def start_up():
    print("Hello I am starting");


def output_click_testBtn():
    __COMMENT__("This function will take input from the input withid of 'testInput' and will print a fahrenheit version of the temperature to the console will also contain error checking")
    celcius = getValue_testInput()
    if (celcius != ""):
        celcius = int(celcius)
        fahrenheit = str((celcius * 9 / 5) + 32) + " f"
        print(fahrenheit)
        setOutput_outputTest(fahrenheit)
    else:
        print("You need to enter a number")
