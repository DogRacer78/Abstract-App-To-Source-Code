from metapensiero.pj.__main__ import transform_string
import sys
appDir = sys.argv[1]
file = open(appDir, "r")
fileContents  = file.read()
print(transform_string(fileContents, enable_es6=True))
file.close()