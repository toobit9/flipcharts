(function () {
    const script = document.currentScript;
    const src = script?.dataset?.src;
    if (!src) return;

    let audio = null;
    let isPlaying = false;

    const controls = document.createElement('div');
    controls.className = 'accompaniment-toggle';
    controls.setAttribute('aria-label', 'Accompaniment controls');

    const playBtn = document.createElement('button');
    playBtn.className = 'accompaniment-btn';
    playBtn.type = 'button';
    playBtn.textContent = '▶';
    playBtn.title = 'Play accompaniment';
    playBtn.setAttribute('aria-label', 'Play accompaniment');

    const stopBtn = document.createElement('button');
    stopBtn.className = 'accompaniment-btn';
    stopBtn.type = 'button';
    stopBtn.textContent = '■';
    stopBtn.title = 'Stop accompaniment';
    stopBtn.setAttribute('aria-label', 'Stop accompaniment');

    controls.append(playBtn, stopBtn);
    document.body.appendChild(controls);

    function getAudio() {
        if (audio) return audio;
        audio = new Audio(src);
        audio.preload = 'auto';
        audio.addEventListener('ended', () => {
            audio.currentTime = 0;
            setPlaying(false);
        });
        audio.addEventListener('pause', () => setPlaying(false));
        audio.addEventListener('play', () => setPlaying(true));
        return audio;
    }

    function setPlaying(nextIsPlaying) {
        isPlaying = nextIsPlaying;
        playBtn.textContent = isPlaying ? '⏸' : '▶';
        playBtn.title = isPlaying ? 'Pause accompaniment' : 'Play accompaniment';
        playBtn.setAttribute('aria-label', playBtn.title);
        playBtn.classList.toggle('active', isPlaying);
    }

    playBtn.addEventListener('click', () => {
        const track = getAudio();
        if (track.paused) {
            track.play().catch(() => setPlaying(false));
        } else {
            track.pause();
        }
    });

    stopBtn.addEventListener('click', () => {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
        setPlaying(false);
    });

    window.addEventListener('pagehide', () => {
        if (audio) audio.pause();
    });
})();

