/*
(async () =>{
    let response = await fetch("https://jacks-groovy-site-f7ee0a.webflow.io/");
    let template = await response.text();
    console.log(template);
})();
*/

fetch("https://jacks-groovy-site-f7ee0a.webflow.io/")
.then((res) =>{
    return res.text();
})
.then((temp) =>{
    console.log(temp);
});
