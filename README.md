# Abstract App To Source Code
This project aims to make web app development easier with the ***'write once, produce many'*** principle. This means developers should not be hindered by creating cross platform apps by only knowing one framework.

# What can it do?
At current the framework is capable of converting an app written in python with some limitations into human readable and functional code as a web app and an electron app. It contains a simplistic MongoDB integration that can be used across multiple web and desktop clients. Check out my blog post I have written about the project <a href="https://dogracer78.github.io/Abstract-App-To-Source-Code/">here</a>.

## Who is this for?
This project is aimed at developers who want to create cross platform apps but do not want to learn multiple frameworks. The framework uses python and abstracts a lot of database operations away from the developer, this means it is perfect for those just learning how to code or want something simple to get started with.

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

## Usage
A guide on how to use the framework can be found <a href="./METHODS.md">here</a>