// generates the date and time the current code was generated at
// returns a string with the relevant info
function generateDateTime(){
    let date = new Date();
    return `Generated on ${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

export {generateDateTime};