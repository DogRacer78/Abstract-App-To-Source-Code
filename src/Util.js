/**
 * Creates a string stating the current date and time
 * @returns A string with stating 'Generated on (current date and time)'
 */
function generateDateTime(){
    let date = new Date();
    return `Generated on ${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

export {generateDateTime};