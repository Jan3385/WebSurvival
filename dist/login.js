function ChangeSeedInputStatus(status){
    let seedInput = document.getElementById("seed");
    seedInput.disabled = !status;
}