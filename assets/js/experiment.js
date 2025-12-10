document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('musicForm');
    const consoleDiv = document.getElementById('console');
    const btn = form.querySelector('button[type="submit"]');
    
    // Player Elements
    const mainAudio = document.getElementById('main-audio');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    
    const playerArt = document.getElementById('player-art');
    const playerTitle = document.getElementById('player-title');
    const downloadLink = document.getElementById('download-link');

    // State
    let isPlaying = false;

    // --- Player Logic ---

    function togglePlay() {
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    }

    function playTrack() {
        mainAudio.play().then(() => {
            isPlaying = true;
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        }).catch(err => console.error("Play error:", err));
    }

    function pauseTrack() {
        mainAudio.pause();
        isPlaying = false;
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }

    function updateProgress(e) {
        const { duration, currentTime } = e.target;
        if (isNaN(duration)) return;
        
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // Update time text
        currentTimeEl.textContent = formatTime(currentTime);
        totalTimeEl.textContent = formatTime(duration);
    }

    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = mainAudio.duration;
        
        mainAudio.currentTime = (clickX / width) * duration;
    }

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // Event Listeners for Player
    playPauseBtn.addEventListener('click', togglePlay);
    mainAudio.addEventListener('timeupdate', updateProgress);
    mainAudio.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = formatTime(mainAudio.duration);
    });
    mainAudio.addEventListener('ended', () => {
        isPlaying = false;
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        progressBar.style.width = '0%';
        currentTimeEl.textContent = '0:00';
    });
    progressContainer.addEventListener('click', setProgress);


    // --- Generation Logic ---

    function log(message, type = 'info', rawData = null) {
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        const time = new Date().toLocaleTimeString();
        let formattedMessage = `<span style="opacity:0.5">[${time}]</span> ${message}`;
        
        if (rawData) {
            formattedMessage += `<pre style="white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(rawData, null, 2)}</pre>`;
        }
        line.innerHTML = formattedMessage;
        consoleDiv.appendChild(line);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-text-content">Generating... <div class="loading-spinner"></div></span>';
        consoleDiv.innerHTML = '';
        
        // Reset player UI indication that something is happening
        playerTitle.textContent = "Generating...";
        playerArt.style.opacity = '0.5';

        const formData = {
            prompt: document.getElementById('prompt').value,
            music_style: document.getElementById('music_style').value,
            make_instrumental: document.getElementById('make_instrumental').checked
        };

        log(`Starting generation request...`, 'info');
        log(`Prompt: "${formData.prompt}"`, 'info');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            log(`Response from /api/generate:`, 'info', data);

            if (!response.ok || !data.success) {
                throw new Error(data.message || `Server responded with status ${response.status}`);
            }

            log(`Task created! ID: ${data.task_id}`, 'success');
            log(`ETA: ${data.eta} seconds. Waiting for results...`, 'info');

            const conversionId1 = data.conversion_id_1;
            
            // Only polling for version 1 for this demo player
            if (conversionId1) {
                pollStatus(conversionId1, 1);
            }

        } catch (error) {
            log(`Generation Request Error: ${error.message}`, 'error', error);
            resetBtn();
        }
    });

    async function pollStatus(id, versionIndex) {
        log(`Polling status for Version ${versionIndex} (ID: ${id.substring(0,8)}...)...`, 'info');
        
        const pollInterval = setInterval(async () => {
            try {
                const url = `/api/status/${id}?idType=conversion_id`;
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.success && data.conversion) {
                    console.log("Full data object from API:", data); // Add this log
                    const status = data.conversion.status;
                    
                    if (status === 'COMPLETED') {
                        clearInterval(pollInterval);
                        log(`Version ${versionIndex} COMPLETED!`, 'success');
                        
                        console.log("Conversion object passed to updatePlayer:", data.conversion); // Add this log
                        updatePlayer(data.conversion, versionIndex);
                        resetBtn();
                    } else if (status === 'FAILED') {
                        clearInterval(pollInterval);
                        log(`Version ${versionIndex} FAILED.`, 'error');
                        resetBtn();
                    }
                }
            } catch (err) {
                console.error("Polling error", err);
                clearInterval(pollInterval);
                resetBtn();
            }
        }, 5000); 
    }

    function updatePlayer(conversion, versionIndex = 1) {
        const audioUrl = conversion[`conversion_path_${versionIndex}`] || conversion.audio_url || conversion.conversion_path;
        const coverUrl = conversion.album_cover_path || conversion.cover_path; // API might vary
        
        if (audioUrl) {
            mainAudio.src = audioUrl;
            playerTitle.textContent = "Generated Track"; // Or use prompt excerpt
            
            if (coverUrl) {
                playerArt.src = coverUrl;
                playerArt.style.opacity = '1';
            }
            
            downloadLink.href = audioUrl;
            
            // Auto play? Maybe not, let user click.
            // But reset play state
            pauseTrack(); 
            mainAudio.load();
        } else {
            log('No audio URL found in result.', 'error');
        }
    }

    function resetBtn() {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-text-content">Generate Music</span>';
    }

    // Initial check (optional)
    fetch('/api/generate', { method: 'GET' }).catch(() => {}); 
});