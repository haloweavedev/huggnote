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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = getData();
    
    if (data.credits <= 0) {
      alert("No credits remaining!");
      return;
    }

    const formData = new FormData(form);
    
    // Mock Generation
    const btn = form.querySelector("button[type='submit']");
    const originalText = btn.innerHTML;
    btn.innerHTML = "Generating Magic...";
    btn.disabled = true;

    setTimeout(() => {
      // Deduct Credit
      data.credits -= 1;

      // Add Song
      data.songs.unshift({
        id: `SONG-${Date.now()}`,
        title: `Song for ${formData.get("recipient")}`,
        recipient: formData.get("recipient"),
        vibe: formData.get("vibe"),
        date: new Date().toLocaleDateString(),
        status: "Ready",
        coverColor: getRandomColor()
      });

      saveData(data);
      
      // Reset Form
      form.reset();
      btn.innerHTML = originalText;
      btn.disabled = false;
      
      // Go Home
      navigateTo('home');
    }, 2000);
  });
}

function renderSongsList(songs) {
  const container = document.getElementById("songs-list-container");
  if (!container) return;

  if (songs.length === 0) {
    // Keep empty state visible if handled by HTML, or toggle it here
    // For now assuming HTML has empty state that we might overwrite
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
    html += `
      <div class="song-item">
        <div class="song-cover" style="background: ${song.coverColor}">
          <span class="material-symbols-outlined">music_note</span>
        </div>
        <div class="song-details">
          <h4>${song.title}</h4>
          <p>${song.vibe} • ${song.date}</p>
        </div>
        <div class="song-actions">
          <button class="btn-icon"><span class="material-symbols-outlined">play_arrow</span></button>
          <button class="btn-icon"><span class="material-symbols-outlined">share</span></button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

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
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("huggnoteUser");
    window.location.href = "index.html";
  });
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
