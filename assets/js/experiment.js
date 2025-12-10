document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('musicForm');
    const consoleDiv = document.getElementById('console');
    const resultsArea = document.getElementById('resultsArea');
    const track1 = document.getElementById('track1');
    const track2 = document.getElementById('track2');
    const btn = form.querySelector('button[type="submit"]');

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
        
        resultsArea.style.display = 'none';
        track1.style.display = 'none';
        track2.style.display = 'none';
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-text-content">Generating... <div class="loading-spinner"></div></span>';
        consoleDiv.innerHTML = '';

        const formData = {
            prompt: document.getElementById('prompt').value,
            music_style: document.getElementById('music_style').value,
            make_instrumental: document.getElementById('make_instrumental').checked
        };

        log(`Starting generation request...`, 'info');
        log(`Prompt: "${formData.prompt}"`, 'info');
        log(`Request Payload:`, 'info', formData);

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
            const conversionId2 = data.conversion_id_2;

            if (conversionId1) {
                pollStatus(conversionId1, 1);
            }
            if (conversionId2) {
                pollStatus(conversionId2, 2);
            } else {
                log('No second conversion ID provided, only polling for one result.', 'info');
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
                // Explicitly append the query param. 
                const url = `/api/status/${id}?idType=conversion_id`;
                // log(`Fetching: ${url}`, 'info'); // Uncomment for debugging if needed

                const res = await fetch(url);
                const data = await res.json();
                
                // Only log details if something interesting happens or it fails
                if (!data.success) {
                     log(`Response from /api/status/${id.substring(0,8)}...:`, 'info', data);
                }

                if (data.success && data.conversion) {
                    const status = data.conversion.status;
                    
                    if (status === 'COMPLETED') {
                        clearInterval(pollInterval);
                        log(`Version ${versionIndex} COMPLETED!`, 'success');
                        displayResult(data.conversion, versionIndex);
                        
                        // Check if all expected tracks are done before resetting button
                        const allTracks = document.querySelectorAll('.audio-card');
                        let completedCount = 0;
                        allTracks.forEach(track => {
                            if (track.style.display === 'grid') completedCount++;
                        });

                        // Assuming two tracks are expected if conversionId2 was present
                        const expectedTracks = track2.style.display === 'none' ? 1 : 2; 

                        if (completedCount >= expectedTracks) {
                            resetBtn();
                        }
                    } else if (status === 'FAILED') {
                        clearInterval(pollInterval);
                        log(`Version ${versionIndex} FAILED. Reason: ${data.conversion.status_msg || 'Unknown'}`, 'error');
                        resetBtn();
                    } else {
                        // Optional: Log 'Processing' periodically or just stay silent
                        // log(`Version ${versionIndex}: ${status}...`, 'info');
                    }
                } else if (!data.success) {
                    log(`API status check for Version ${versionIndex} failed: ${data.message || 'Unknown error.'}`, 'error');
                }
            } catch (err) {
                console.error("Polling error", err);
                log(`Polling Error for Version ${versionIndex}: ${err.message}`, 'error', err);
                clearInterval(pollInterval); // Stop polling on client-side error
                resetBtn();
            }
        }, 5000); // Poll every 5 seconds
    }

    function displayResult(conversion, index) {
        resultsArea.style.display = 'block';
        const card = index === 1 ? track1 : track2;
        const audio = card.querySelector('audio');
        const link = card.querySelector('a');

        const audioUrl = conversion.audio_url || conversion.conversion_path;
        if (audioUrl) {
            card.style.display = 'grid';
            audio.src = audioUrl;
            link.href = audioUrl;
            link.textContent = `Download Version ${index}`;
            
            card.style.opacity = '0';
            requestAnimationFrame(() => {
                card.style.transition = 'opacity 0.5s ease';
                card.style.opacity = '1';
            });
        } else {
            log(`No audio URL found for Version ${index}.`, 'error', conversion);
        }
    }

    function resetBtn() {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-text-content">Generate Music</span>';
    }

    fetch('/api/generate', { method: 'GET' })
        .then(res => res.json())
        .then(data => {
            if (!data.success && data.message.includes('API_KEY is not set')) {
                log('Please configure your MUSICGPT_API_KEY in the .env file.', 'error');
                btn.disabled = true;
                btn.innerHTML = '<span class="btn-text-content">API Key Missing!</span>';
            }
        })
        .catch(() => {}); 
});
