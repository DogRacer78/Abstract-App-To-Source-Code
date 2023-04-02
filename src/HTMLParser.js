import { parse } from "node-html-parser";

// function to parse the HTML from the WebFlow site and look for the fake-form attribute

/**
 * Parses the HTML provided and looks for fake-form="true" attributes,
 * then manipulates the HTML as needed to stop webflow forms from posting
 * @param {String} html String of HTML to parse
 * @returns Manipulated HTML string
 */
function handleFakeForm(html){
    // parse using the node-parse lib
    let root = parse(html);
    // get all the elements with a div tag
    let divElements = root.getElementsByTagName("div");

    // loop through all the div elements and find any that have the attribute fake form
    // remove the w-form from the class section
    // also need to add onsubmit=return fasle to stop the form from being submitted
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

    // add the socket.io import
    root.insertAdjacentHTML("beforeend", '<script src="https://cdn.socket.io/4.6.0/socket.io.min.js"' + 
    'integrity="sha384-c79GN5VsunZvi+Q/WObgk2in0CbZsHnjEqvFxC5DxHn9lTfNce2WW6h2pH6u/kF+"' +
    'crossorigin="anonymous"></script>')

    // add the index.js script tag to the end
    root.insertAdjacentHTML("beforeend", "<script src='/static/index.js'></script>");


    return root.toString();
}

export {handleFakeForm};