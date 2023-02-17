(async () =>{
    let response = await fetch("https://jacks-groovy-site-f7ee0a.webflow.io/");
    let template = await response.text();
    console.log(template);
})();