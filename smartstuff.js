const music = document.getElementById("bg-music");
const button = document.getElementById("music-toggle");

music.volume = 0.075;

button.addEventListener("click", async () => {
    if (music.paused) {
        try {
            await music.play();
            button.textContent = "🔊";
        } catch (error) {
            console.log("SYSTEM_PLAYBACK_FAILURE:", error);
        }
    } else {
        music.pause();
        button.textContent = "▶";
    }
});

// Playing music automatically on load
music.play().then(() => {
    button.textContent = "🔊";
}).catch((error) => {
    console.log("SYSTEM_AUTOPLAY_FAILURE:", error);
    button.textContent = "▶";
});