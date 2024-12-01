function ChangeSeedInputStatus(status){
    let seedInput = document.getElementById("seed");
    seedInput.disabled = !status;
}

const video = document.getElementById('background-video');
video.addEventListener('loadedmetadata', () => {
    video.currentTime = 10;
});