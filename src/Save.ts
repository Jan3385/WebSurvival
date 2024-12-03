declare let worldName: string;
declare let password: string;

function Save(){
    console.log("Saving wolrd "+ worldName);

    // Save the world
    fetch('../web-files/saveWorld.php', {
        method: 'POST',
        body: JSON.stringify({
            worldName: worldName,
            password: password, // <- unsafe 🥶
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        },
        }).then(response => {
            if(response.ok){
                console.log("World saved");
        }else{
            response.text().then(text => { console.log(text); });
        }});
}