import { parse, valid } from "node-html-parser";

/**
 * Parses the HTML provided and looks for fake-form="true" attributes,
 * then manipulates the HTML as needed to stop webflow forms from posting
 * @param {String} html String of HTML to parse
 * @returns Manipulated HTML string
 */
function handleFakeForm(html){
    // check if the HTML is valid
    if (!valid(html)){
        throw new Error("HTML is invalid, please check");
    }

    // parse using the node-parse lib
    let root = parse(html);
    // get all the elements with a div tag
    let divElements = root.getElementsByTagName("div");

    // loop through all the div elements and find any that have the attribute fake form
    // remove the w-form from the class section
    // also need to add onsubmit=return false to stop the form from being submitted
    for (let i = 0; i < divElements.length; i++){
        let element = divElements[i];
        if (element.getAttribute("fake-form") === "true"){
            console.log(element);
            element.setAttribute("class", element.getAttribute("class").replace("w-form", ""));
            // get the form tags
            let forms = element.getElementsByTagName("form");
            for (let j = 0; j < forms.length; j++){
                forms[j].setAttribute("onsubmit", "return false");
            }
        }
    }

    return root.toString();
}

/**
 * Adds a reference to the index.js in the HTML for an electron app
 * Different to a web app, due to differences in their path
 * @param {Object} html HTML to parse and add the index.js reference to
 * @returns {String} The HTML after it has been modified
 */
function addElectronIndex(html){
    // parse the HTML
    let root = parse(html);

    // insert at the end
    root.insertAdjacentHTML("beforeend", "<script src='./index.js'></script>");

    return root.toString();
}

/**
 * Adds a reference to the index.js for a web app
 * @param {Object} html The HTML to parse
 * @param {Boolean} isLocalHTML If the HTML is a local file or not
 * @returns {String} The modified HTML
 */
function addWebIndex(html, isLocalHTML){
    // parse the HTML
    let root = parse(html);

    // add the socket.io import
    root.insertAdjacentHTML("beforeend", '<script src="https://cdn.socket.io/4.6.0/socket.io.min.js"' + 
    'integrity="sha384-c79GN5VsunZvi+Q/WObgk2in0CbZsHnjEqvFxC5DxHn9lTfNce2WW6h2pH6u/kF+"' +
    'crossorigin="anonymous"></script>');

    // check if this is a local HTML file,
    // if it is, we need to include the Jquery import
    if (isLocalHTML){
        root.insertAdjacentHTML("beforeend", '<script src="https://code.jquery.com/jquery-3.5.1.min.js"' +
        'integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0="' +
        'crossorigin="anonymous"></script>');
    }

    // insert at the end
    root.insertAdjacentHTML("beforeend", "<script src='./static/index.js'></script>");

    return root.toString();
}

export {handleFakeForm, addElectronIndex, addWebIndex};