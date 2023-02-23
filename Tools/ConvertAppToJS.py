from metapensiero.pj.__main__ import transform_string
file = open("App.py", "r")
fileContents  = file.read()
print(transform_string(fileContents, enable_es6=True))
file.close()