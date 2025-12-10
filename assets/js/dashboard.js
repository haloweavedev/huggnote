document.addEventListener("DOMContentLoaded", () => {
  // Auth Check
  const user = localStorage.getItem("huggnoteUser");
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Initialize Data
  initData();
  
  // Render Initial View
  setupNavigation();
  setupFormHandler();
  setupLogout();
  setupReset();
});

// -- State Management --

const DEFAULT_DATA = {
  credits: 0,
  songs: [],
  orders: []
};

function initData() {
  if (!localStorage.getItem("huggnoteData")) {
    localStorage.setItem("huggnoteData", JSON.stringify(DEFAULT_DATA));
  }
  updateUI();
}

function getData() {
  return JSON.parse(localStorage.getItem("huggnoteData") || JSON.stringify(DEFAULT_DATA));
}

function saveData(data) {
  localStorage.setItem("huggnoteData", JSON.stringify(data));
  updateUI();
}

// -- UI Updates --

function updateUI() {
  const data = getData();
  const user = JSON.parse(localStorage.getItem("huggnoteUser"));

  // Sidebar & Header Info
  document.getElementById("user-email-display").textContent = user.email;
  document.getElementById("user-credits-display").textContent = `${data.credits} Credits`;
  
  // Stats
  const songsCount = document.getElementById("stats-songs-count");
  if (songsCount) songsCount.textContent = data.songs.length;
  
  const creditsCount = document.getElementById("stats-credits-count");
  if (creditsCount) creditsCount.textContent = data.credits;

  const createCredits = document.getElementById("create-credits-display");
  if (createCredits) createCredits.textContent = `${data.credits} Credits`;

  // Create View Logic
  const noCreditsState = document.getElementById("no-credits-state");
  const formContainer = document.getElementById("create-form-container");
  
  if (noCreditsState && formContainer) {
    if (data.credits > 0) {
      noCreditsState.style.display = "none";
      formContainer.style.display = "block";
    } else {
      noCreditsState.style.display = "block";
      formContainer.style.display = "none";
    }
  }

  // Render Lists
  renderSongsList(data.songs);
  renderOrdersList(data.orders);
}

// -- Navigation --

function setupNavigation() {
  const links = document.querySelectorAll("[data-view]");
  links.forEach(link => {
    link.addEventListener("click", () => {
      // Toggle Active State
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      // Show View
      const viewId = link.dataset.view;
      document.querySelectorAll(".dashboard-view").forEach(view => {
        view.style.display = "none";
      });
      document.getElementById(`view-${viewId}`).style.display = "block";
    });
  });
}

function navigateTo(viewId) {
  document.querySelector(`[data-view="${viewId}"]`).click();
}

// -- Features --

function mockPurchase(plan) {
  const data = getData();
  const orderId = `ORD-${Math.floor(Math.random() * 10000)}`;
  const date = new Date().toLocaleDateString();
  
  let amount, credits, pkgName;

  if (plan === 'single') {
    amount = "$79.00";
    credits = 1; // Actually 1 song slot (w/ 5 regens each internal logic, simplified here to song slots)
    pkgName = "Single Pack";
  } else {
    amount = "$299.00";
    credits = 5;
    pkgName = "Multi Pack";
  }

  // Add Order
  data.orders.unshift({ id: orderId, date, package: pkgName, amount, status: "Paid" });
  
  // Add Credits
  data.credits += credits;

  saveData(data);
  alert("Payment Successful! Credits added.");
  navigateTo('home');
}

function setupFormHandler() {
  const form = document.getElementById("song-creation-form");
  if (!form) return;

  // 1. Handle Prompt Generation (Free / Iterative)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("[DASHBOARD] Form submitted for prompt generation.");
    
    const data = getData();
    
    // Optional: You might want to allow prompt generation even with 0 credits if it's "free" to draft
    // But based on current UI logic, the form is hidden if credits are 0, so this check is redundant but safe.
    if (data.credits <= 0) {
      alert("No credits remaining!");
      return;
    }

    const formData = new FormData(form);
    const formObject = Object.fromEntries(formData.entries());
    formObject.include_name = form.querySelector('[name="include_name"]').checked;

    console.log("[DASHBOARD] Form Data:", formObject);

    // Save Form Data
    localStorage.setItem('huggnoteLastForm', JSON.stringify(formObject));

    // UI Loading State
    const btn = form.querySelector("button[type='submit']");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">refresh</span> Generating Prompt...`;
    btn.disabled = true;

    try {
      console.log("[DASHBOARD] Sending request to /api/create-prompt...");
      const response = await fetch('/api/create-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formObject)
      });

      console.log("[DASHBOARD] Response status:", response.status);
      const result = await response.json();
      console.log("[DASHBOARD] Response body:", result);

      if (result.success) {
        // Display Prompt
        const promptContainer = document.getElementById("generated-prompt-container");
        const promptText = document.getElementById("generated-prompt-text");
        
        promptText.textContent = result.prompt;
        promptContainer.style.display = "block";
        
        // Save prompt temporarily for the finalize step
        localStorage.setItem('huggnoteLastPrompt', result.prompt);
        
        // Scroll to prompt
        promptContainer.scrollIntoView({ behavior: 'smooth' });

      } else {
        alert("Failed to generate prompt: " + result.message);
      }

    } catch (error) {
      console.error("[DASHBOARD] Error:", error);
      alert("An error occurred while communicating with the server.");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });

  // 2. Handle Song Finalization (Costs Credit)
  const finalizeBtn = document.getElementById("finalize-song-btn");
  if (finalizeBtn) {
    finalizeBtn.addEventListener("click", async () => {
       console.log("[DASHBOARD] Finalize Song clicked.");
       const data = getData();
       
       if (data.credits <= 0) {
         alert("No credits remaining!");
         return;
       }

       // Retrieve stored form data and prompt
       const lastForm = JSON.parse(localStorage.getItem('huggnoteLastForm') || '{}');
       const lastPrompt = localStorage.getItem('huggnoteLastPrompt') || '';

       if (!lastPrompt) {
         alert("No prompt found. Please generate a prompt first.");
         return;
       }

       // UI Loading State
       const originalText = finalizeBtn.innerHTML;
       finalizeBtn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">refresh</span> Creating...`;
       finalizeBtn.disabled = true;

       try {
           // Prepare payload for MusicGPT
           const payload = {
               prompt: lastPrompt,
               // Use 'style' from form or default to 'Pop' if missing
               music_style: lastForm.style || 'Pop', 
               make_instrumental: false,
               vocal_only: false
           };

           console.log("[DASHBOARD] Sending generation request to /api/generate:", payload);

           const response = await fetch('/api/generate', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(payload)
           });

           const result = await response.json();
           console.log("[DASHBOARD] Generation response:", result);

           if (result.success) {
               // Deduct Credit immediately upon successful submission
               data.credits -= 1;
               
               // Create a temporary song entry with 'Processing' status
               const tempId = `SONG-${Date.now()}`;
               const songEntry = {
                  id: tempId,
                  title: `Song for ${lastForm.recipient || 'Someone'}`,
                  recipient: lastForm.recipient || 'Unknown',
                  vibe: lastForm.vibe || 'Custom',
                  date: new Date().toLocaleDateString(),
                  status: "Processing",
                  coverColor: getRandomColor(),
                  prompt: lastPrompt,
                  taskId: result.task_id,
                  conversionId1: result.conversion_id_1,
                  conversionId2: result.conversion_id_2,
                  eta: result.eta || 120
               };
               
               data.songs.unshift(songEntry);
               saveData(data); // Update UI
               
               // Start Polling with Timer UI
               startPolling(songEntry, result.eta);
               
               alert(`Song creation started! It will take about ${result.eta} seconds.`);
               navigateTo('home');

           } else {
               alert("Failed to start song generation: " + result.message);
               finalizeBtn.disabled = false;
               finalizeBtn.innerHTML = originalText;
           }

       } catch (error) {
           console.error("[DASHBOARD] Error finalizing song:", error);
           alert("An error occurred. Please try again.");
           finalizeBtn.disabled = false;
           finalizeBtn.innerHTML = originalText;
       }
    });
  }
}

async function startPolling(song, eta) {
    console.log(`[POLLING] Starting poll for task ${song.taskId} (ETA: ${eta}s)`);
    
    // Update UI to show progress if visible (e.g. in song list)
    // We can use a simple interval to update the countdown in the UI if we had a specific element
    // For now, we'll just poll the status.
    
    const pollInterval = 10000; // Poll every 10 seconds
    const maxAttempts = (eta * 2) / 10 + 10; // Give it double the ETA time + buffer
    let attempts = 0;

    const intervalId = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(intervalId);
            console.warn("[POLLING] Max attempts reached. Stopping poll.");
            updateSongStatus(song.id, "Failed (Timeout)");
            return;
        }

        try {
            // Check status using task_id
            // Note: MusicGPT docs say "You must provide either task_id or conversion_id"
            // We'll use task_id to check the overall task or the first conversion.
            // Let's try checking the first conversion ID specifically as that's what we want to play.
            const checkId = song.conversionId1 || song.taskId;
            const idType = song.conversionId1 ? 'conversion_id' : 'task_id';

            const response = await fetch(`/api/status/${checkId}?idType=${idType}&conversionType=MUSIC_AI`);
            const data = await response.json();
            
            console.log(`[POLLING] Status check (${attempts}):`, data);

            if (data.success && data.conversion) {
                const status = data.conversion.status;
                
                if (status === 'COMPLETED') {
                    clearInterval(intervalId);
                    console.log("[POLLING] Generation COMPLETED!");
                    console.log("[POLLING] Full Conversion Data:", JSON.stringify(data.conversion, null, 2));
                    
                    // Update Song Data
                    const storedData = getData();
                    const songIndex = storedData.songs.findIndex(s => s.id === song.id);
                    
                    if (songIndex !== -1) {
                        const c = data.conversion;
                        
                        // Robustly find the audio URL
                        // Prioritize audio_url as per user's latest log
                        const audioUrl = c.audio_url || c.conversion_path || c.url || c.result_url || c.file_url || c.s3_path;
                        
                        if (audioUrl) {
                            storedData.songs[songIndex].status = "Ready";
                            storedData.songs[songIndex].audioUrl = audioUrl;
                            
                            // Robustly find the cover image
                            storedData.songs[songIndex].coverImage = c.album_cover_url || c.cover_image || c.cover_url || c.image_url;
                            if (!storedData.songs[songIndex].coverImage) {
                                 storedData.songs[songIndex].coverImage = "assets/img/hero-bg.jpg"; // Placeholder
                            }
                            
                            saveData(storedData);
                            console.log("[POLLING] Song updated in storage with Audio URL:", audioUrl);
                            
                            // Refresh List
                            if (document.getElementById("view-home").style.display !== "none") {
                                renderSongsList(storedData.songs);
                            }
                        } else {
                            console.error("[POLLING] CRITICAL: Audio URL not found in response keys!", Object.keys(c));
                            storedData.songs[songIndex].status = "Failed (No Audio)";
                            saveData(storedData);
                            if (document.getElementById("view-home").style.display !== "none") {
                                renderSongsList(storedData.songs);
                            }
                        }
                    }
                } else if (status === 'FAILED') {
                    clearInterval(intervalId);
                    console.error("[POLLING] Generation FAILED.");
                    updateSongStatus(song.id, "Failed");
                }
            }
        } catch (e) {
            console.error("[POLLING] Error checking status:", e);
        }
    }, pollInterval);
}

function updateSongStatus(songId, status) {
    const data = getData();
    const songIndex = data.songs.findIndex(s => s.id === songId);
    if (songIndex !== -1) {
        data.songs[songIndex].status = status;
        saveData(data);
        renderSongsList(data.songs);
    }
}

function renderSongsList(songs) {
  const container = document.getElementById("songs-list-container");
  if (!container) return;

  if (songs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><span class="material-symbols-outlined">music_note</span></div>
        <h3>No songs yet</h3>
        <p>You haven't created any songs yet. Use a credit to get started!</p>
        <button class="btn btn-secondary" onclick="navigateTo('create')">Create Song</button>
      </div>
    `;
    return;
  }

  let html = `<div class="song-grid">`;
  songs.forEach(song => {
    // Determine card content based on status
    let cardContent = "";
    let clickAction = "";
    
    if (song.status === "Processing") {
        cardContent = `
            <div class="song-cover" style="background: ${song.coverColor}; display: flex; justify-content: center; align-items: center;">
                 <span class="material-symbols-outlined" style="animation: spin 2s linear infinite;">sync</span>
            </div>
            <div class="song-details">
                <h4>${song.title}</h4>
                <p class="muted">Generating... (Est. ${song.eta}s)</p>
            </div>
        `;
    } else if (song.status === "Ready") {
        const coverStyle = song.coverImage 
            ? `background-image: url('${song.coverImage}'); background-size: cover;` 
            : `background: ${song.coverColor};`;
            
        cardContent = `
            <div class="song-cover" style="${coverStyle}">
                 ${!song.coverImage ? '<span class="material-symbols-outlined">music_note</span>' : ''}
            </div>
            <div class="song-details">
                <h4>${song.title}</h4>
                <p>${song.vibe} • ${song.date}</p>
            </div>
            <div class="song-actions">
                <button class="btn-icon play-btn" data-audio="${song.audioUrl}"><span class="material-symbols-outlined">play_arrow</span></button>
                <button class="btn-icon"><span class="material-symbols-outlined">share</span></button>
            </div>
        `;
    } else {
        // Failed
        cardContent = `
            <div class="song-cover" style="background: #fee2e2; color: #ef4444;">
                 <span class="material-symbols-outlined">error</span>
            </div>
            <div class="song-details">
                <h4>${song.title}</h4>
                <p style="color: #ef4444;">Generation Failed</p>
            </div>
        `;
    }

    html += `
      <div class="song-item" id="song-card-${song.id}" onclick="openPlayer('${song.id}')" style="cursor: ${song.status === 'Ready' ? 'pointer' : 'default'}">
        ${cardContent}
      </div>
    `;
  });
  html += `</div>`;
  
  // Add global audio player container if not exists
  if (!document.getElementById("global-audio-player")) {
      html += `<audio id="global-audio-player" style="display:none;"></audio>`;
  }
  
  container.innerHTML = html;
  
  // Attach event listeners for play buttons (prevent bubble to card click)
  container.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const audioUrl = btn.dataset.audio;
          playSong(audioUrl, btn);
      });
  });
}

function openPlayer(songId) {
    const data = getData();
    const song = data.songs.find(s => s.id === songId);
    
    if (song && song.status === 'Ready') {
        const params = new URLSearchParams({
            title: song.title,
            recipient: song.recipient,
            vibe: song.vibe,
            audio: song.audioUrl
        });
        // Open in new tab
        window.open(`player.html?${params.toString()}`, '_blank');
    }
}

function playSong(url, btnElement) {
    const audio = document.getElementById("global-audio-player");
    const icon = btnElement.querySelector(".material-symbols-outlined");
    
    // If currently playing this song, pause it
    if (!audio.paused && audio.src === url) {
        audio.pause();
        icon.textContent = "play_arrow";
        return;
    }
    
    // Reset all other icons
    document.querySelectorAll(".play-btn .material-symbols-outlined").forEach(i => i.textContent = "play_arrow");
    
    // Play new song
    audio.src = url;
    audio.play();
    icon.textContent = "pause";
    
    audio.onended = () => {
        icon.textContent = "play_arrow";
    };
}

function copyPrompt() {
  const text = document.getElementById("generated-prompt-text").textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert("Prompt copied to clipboard!");
  });
}

// Add CSS animation for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin { 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

window.copyPrompt = copyPrompt;
window.openPlayer = openPlayer;

function renderOrdersList(orders) {
  const tbody = document.getElementById("orders-table-body");
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center muted">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.date}</td>
      <td>${order.package}</td>
      <td>${order.amount}</td>
      <td><span class="status-chip status-paid">${order.status}</span></td>
      <td><button class="btn-text">Download</button></td>
    </tr>
  `).join("");
}

function setupLogout() {
  const btn = document.getElementById("logout-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      localStorage.removeItem("huggnoteUser");
      window.location.href = "index.html";
    });
  }
}

function setupReset() {
  const resetBtn = document.getElementById("reset-data-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
       localStorage.removeItem('huggnoteUser');
       localStorage.removeItem('huggnoteData');
       alert('Local data (huggnoteUser, huggnoteData) has been reset!');
       window.location.reload(); 
    });
  }
}

// Utils
function getRandomColor() {
  const colors = [
    "linear-gradient(135deg, #a855f7, #ec4899)",
    "linear-gradient(135deg, #3b82f6, #06b6d4)",
    "linear-gradient(135deg, #f97316, #f59e0b)",
    "linear-gradient(135deg, #10b981, #14b8a6)"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Global helpers for HTML inline calls
window.navigateTo = navigateTo;
window.mockPurchase = mockPurchase;


