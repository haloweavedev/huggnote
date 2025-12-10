document.addEventListener("DOMContentLoaded", () => {
  setupSmoothScroll();
  setupPlanSelection();
  setupFormValidation();
  setupPillSelectors();
  setupSongAdder();
  setupTabs();
  setupCopyButtons();
  setupGiftInteraction();
  setupMockCheckout();
  setupVersionSelection();
  hydrateOrderSummary();
  setupAdminDrawer();
});

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

function setupPlanSelection() {
  const buttons = document.querySelectorAll("[data-plan]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const plan = {
        id: btn.dataset.plan,
        price: btn.dataset.price,
        label: btn.dataset.label,
      };
      localStorage.setItem("huggnotePlan", JSON.stringify(plan));
      const href = btn.getAttribute("data-href");
      if (href) {
        window.location.href = href;
      }
    });
  });

  const planStrip = document.querySelector("[data-plan-strip]");
  if (planStrip) {
    const plan = readPlan();
    if (plan) {
      planStrip.querySelector("[data-plan-name]").textContent = plan.label;
      planStrip.querySelector("[data-plan-price]").textContent = plan.price;
    }
  }
}

function readPlan() {
  const raw = localStorage.getItem("huggnotePlan");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setupFormValidation() {
  const forms = document.querySelectorAll("form[data-flow]");
  if (!forms.length) return;

  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      const requiredFields = form.querySelectorAll("[data-required]");
      let valid = true;
      requiredFields.forEach((field) => {
        const message =
          field.closest(".input-group")?.querySelector(".error") ||
          field.parentElement.querySelector(".error") ||
          field.closest("section")?.querySelector(".error");
        if (message) message.textContent = "";
        const isCheckbox = field.type === "checkbox";
        const empty = isCheckbox ? !field.checked : !field.value.trim();
        if (empty) {
          valid = false;
          if (message) message.textContent = "This field is required.";
        }
      });

      if (!valid) {
        e.preventDefault();
        form.scrollIntoView({ behavior: "smooth" });
        return;
      }

      const flow = form.dataset.flow;
      if (flow === "order") {
        e.preventDefault();
        const confirmation = document.querySelector("[data-confirmation]");
        if (confirmation) {
          confirmation.textContent = "Order received – we'll send your previews within 2–3 business days.";
          confirmation.classList.add("success");
        }
        setTimeout(() => (window.location.href = "preview.html"), 800);
      } else if (flow === "checkout") {
        e.preventDefault();
        const payBtn = form.querySelector("[data-pay]");
        if (payBtn) {
          payBtn.textContent = "Processing...";
          payBtn.disabled = true;
        }
        setTimeout(() => (window.location.href = "success.html"), 600);
      }
    });
  });
}

function setupPillSelectors() {
  document.querySelectorAll(".pill-option").forEach((pill) => {
    if (pill.dataset.bound) return;
    pill.dataset.bound = "true";
    pill.addEventListener("click", () => {
      const group = pill.closest(".pill-select");
      if (!group) return;
      group.querySelectorAll(".pill-option").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const targetInput = group.dataset.bind;
      if (targetInput) {
        const hidden = document.querySelector(`#${targetInput}`);
        if (hidden) hidden.value = pill.dataset.value || pill.textContent.trim();
      }
    });
  });
}

function setupSongAdder() {
  const addBtn = document.querySelector("[data-add-song]");
  const list = document.querySelector("[data-song-list]");
  if (!addBtn || !list) return;

  let count = list.querySelectorAll("details").length || 1;

  addBtn.addEventListener("click", () => {
    if (count >= 5) return;
    count += 1;
    const node = document.createElement("details");
    node.className = "song-card";
    node.open = true;
    node.innerHTML = getSongFields(count);
    list.appendChild(node);
    updateCounter();
    setupPillSelectors();
  });

  function updateCounter() {
    addBtn.querySelector("[data-count]").textContent = `${count}/5`;
  }

  updateCounter();
}

function getSongFields(index) {
  return `
    <summary>Song ${index} <span class="summary-meta">Personalize this track</span></summary>
    <div class="form-grid" style="margin-top:12px;">
      <div class="input-group">
        <label for="song-for-${index}">Who is the song for?</label>
        <input id="song-for-${index}" name="songFor${index}" placeholder="e.g. Mum, Sarah, my boyfriend" data-required />
      </div>
      <div class="input-group">
        <label for="relationship-${index}">Relationship</label>
        <select id="relationship-${index}" name="relationship${index}">
          <option>Family - Mum / Dad</option>
          <option>Family - Brother / Sister</option>
          <option>Family - Son / Daughter</option>
          <option>Family - Aunt / Uncle / Cousin</option>
          <option>Friend - Close friend</option>
          <option>Friend - Good friend</option>
          <option>Friend - New friend / colleague</option>
          <option>Romantic - Partner / Spouse</option>
          <option>Romantic - Someone I'm dating</option>
          <option>Neutral - Someone special</option>
        </select>
      </div>
      <div class="input-group">
        <label>How should the song express your feelings?</label>
        <div class="pill-select" data-bind="feelings-${index}">
          <button type="button" class="pill-option" data-value="Warm & caring">Warm & caring</button>
          <button type="button" class="pill-option" data-value="Romantic & loving">Romantic & loving</button>
          <button type="button" class="pill-option" data-value="Light & flirty">Light & flirty</button>
          <button type="button" class="pill-option" data-value="Keep it neutral">Keep it neutral</button>
        </div>
        <input type="hidden" id="feelings-${index}" name="feelings${index}" />
      </div>
      <div class="input-group">
        <label for="vibe-${index}">How should the song feel overall?</label>
        <select id="vibe-${index}" name="vibe${index}">
          <option>Heartfelt & emotional</option>
          <option>Fun & joyful</option>
          <option>Romantic & cosy</option>
          <option>Uplifting & festive</option>
          <option>Surprise me</option>
        </select>
      </div>
      <div class="input-group">
        <label for="style-${index}">Christmas style</label>
        <select id="style-${index}" name="style${index}">
          <option>Very Christmassy (bells + big festive feel)</option>
          <option>Warm & wintry (cosy Christmas)</option>
          <option>Modern pop holiday</option>
          <option>Acoustic & intimate</option>
          <option>Surprise me</option>
        </select>
      </div>
      <div class="input-group">
        <label for="story-${index}">Tell us the story you want in this song.</label>
        <textarea id="story-${index}" name="story${index}" placeholder="Share memories, special moments, inside jokes..." data-required></textarea>
        <p class="helper">Include personal details, the more detail the better.</p>
        <p class="error"></p>
      </div>
      <div class="input-group">
        <label for="keywords-${index}">Keywords</label>
        <input id="keywords-${index}" name="keywords${index}" placeholder="e.g., love, family, laughter, cozy, together" />
        <p class="helper">Separate keywords with commas.</p>
      </div>
      <div class="input-group">
        <label>Personalisation level</label>
        <div class="pill-select" data-bind="personal-${index}">
          <button type="button" class="pill-option" data-value="Very personal">Very personal</button>
          <button type="button" class="pill-option" data-value="Personal but gentle">Personal but gentle</button>
          <button type="button" class="pill-option" data-value="More general">More general</button>
        </div>
        <input type="hidden" id="personal-${index}" name="personal${index}" />
      </div>
      <div class="input-group">
        <label>Song length</label>
        <div class="pill-select" data-bind="length-${index}">
          <button type="button" class="pill-option" data-value="Short & sweet">Short & sweet</button>
          <button type="button" class="pill-option" data-value="Standard">Standard</button>
          <button type="button" class="pill-option" data-value="Full song">Full song</button>
        </div>
        <input type="hidden" id="length-${index}" name="length${index}" />
      </div>
      <div class="input-group">
        <label for="include-name-${index}">Include their name in the lyrics?</label>
        <select id="include-name-${index}" name="includeName${index}">
          <option>Yes</option>
          <option>No</option>
        </select>
      </div>
    </div>
  `;
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
        panel.style.display = panel.dataset.tabPanel === target ? "grid" : "none";
      });
      tab.classList.add("active");
    });
  });
  // Activate first tab by default
  const first = tabs[0];
  if (first) first.click();
}

function setupCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.dataset.copy);
      if (!target) return;
      target.select();
      navigator.clipboard.writeText(target.value).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = "Copy link"), 1200);
      });
    });
  });
}

function setupGiftInteraction() {
  const gift = document.querySelector("[data-gift]");
  if (!gift) return;
  const hearts = document.querySelector("[data-hearts]");
  const audio = document.querySelector("audio");
  const playerCard = document.querySelector("[data-player-card]");

  gift.addEventListener("click", () => {
    if (hearts) {
      hearts.innerHTML = "";
      for (let i = 0; i < 14; i++) {
        const h = document.createElement("div");
        h.className = "heart";
        h.style.left = `${20 + Math.random() * 60}%`;
        h.style.animationDelay = `${Math.random() * 0.6}s`;
        hearts.appendChild(h);
      }
      hearts.style.opacity = "1";
      setTimeout(() => (hearts.style.opacity = "0"), 2000);
    }
    if (playerCard) playerCard.style.display = "block";
    if (audio) audio.play().catch(() => {});
  });
}

function setupMockCheckout() {
  const payBtn = document.querySelector("[data-pay]");
  if (!payBtn) return;
  const parentFlow = payBtn.closest("form")?.dataset.flow;
  if (parentFlow === "checkout") return;
  payBtn.addEventListener("click", (e) => {
    e.preventDefault();
    payBtn.textContent = "Processing...";
    payBtn.disabled = true;
    setTimeout(() => {
      window.location.href = "success.html";
    }, 900);
  });
}

function setupVersionSelection() {
  const buttons = document.querySelectorAll("[data-version]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selection = {
        song: btn.dataset.song,
        version: btn.dataset.version,
        note: btn.dataset.note,
      };
      localStorage.setItem("huggnoteVersion", JSON.stringify(selection));
      window.location.href = "checkout.html";
    });
  });
}

function hydrateOrderSummary() {
  const plan = readPlan();
  const versionRaw = localStorage.getItem("huggnoteVersion");
  const version = versionRaw ? JSON.parse(versionRaw) : null;
  const planTarget = document.querySelector("[data-summary-plan]");
  const versionTarget = document.querySelector("[data-summary-version]");
  const priceTarget = document.querySelector("[data-summary-price]");

  if (planTarget && plan) {
    planTarget.textContent = `${plan.label} — ${plan.price}`;
  }
  if (priceTarget && plan) {
    priceTarget.textContent = plan.price;
  }
  if (versionTarget && version) {
    versionTarget.textContent = `${version.song} · Version ${version.version}`;
  }
}

function setupAdminDrawer() {
  const rows = document.querySelectorAll("[data-order-row]");
  const drawer = document.querySelector("[data-drawer]");
  if (!rows.length || !drawer) return;

  rows.forEach((row) => {
    row.addEventListener("click", () => {
      drawer.style.display = "block";
      const { id, customer, plan, status, note } = row.dataset;
      const idNode = drawer.querySelector("[data-drawer-id]");
      const customerNode = drawer.querySelector("[data-drawer-customer]");
      const statusNode = drawer.querySelector("[data-drawer-status]");
      const noteNode = drawer.querySelector("[data-drawer-note]");
      if (idNode) idNode.textContent = id || "Order";
      if (customerNode) customerNode.textContent = `${customer} · ${plan}`;
      if (statusNode) statusNode.textContent = status;
      if (noteNode) noteNode.textContent = note;
    });
  });
}
