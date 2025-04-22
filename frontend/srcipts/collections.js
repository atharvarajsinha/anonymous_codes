const modal = document.getElementById("modal");
const requestName = document.getElementById("requestName");
const requestType = document.getElementById("requestType");
const requestData = document.getElementById("requestData");
const collectionsList = document.getElementById("collectionsList");
const modalTitle = document.getElementById("modalTitle");

let editingIndex = null;

function openModal(editIndex = null) {
  modal.classList.remove("hidden");
  editingIndex = editIndex;

  if (editIndex !== null) {
    const data = JSON.parse(localStorage.getItem("requests"))[editIndex];
    requestName.value = data.name;
    requestType.value = data.type;
    requestData.value = data.data;
    modalTitle.textContent = "Edit Request";
  } else {
    requestName.value = "";
    requestType.value = "GET";
    requestData.value = "";
    modalTitle.textContent = "Add Request";
  }
}

function closeModal() {
  modal.classList.add("hidden");
  editingIndex = null;
}

document.getElementById("addRequestBtn").addEventListener("click", () => openModal());

document.getElementById("saveRequest").addEventListener("click", () => {
  const name = requestName.value.trim();
  const type = requestType.value;
  const data = requestData.value.trim();
  if (!name || !data) return alert("Please fill all fields");

  let saved = JSON.parse(localStorage.getItem("requests") || "[]");

  if (editingIndex !== null) {
    saved[editingIndex] = { name, type, data };
  } else {
    saved.push({ name, type, data });
  }

  localStorage.setItem("requests", JSON.stringify(saved));
  closeModal();
  renderRequests();
});

function renderRequests() {
  const saved = JSON.parse(localStorage.getItem("requests") || "[]");
  collectionsList.innerHTML = "";

  if (!saved.length) {
    collectionsList.innerHTML = `<p class="empty-state">No saved requests yet.</p>`;
    return;
  }

  saved.forEach((req, index) => {
    const card = document.createElement("div");
    card.className = "request-card";
    card.innerHTML = `
      <div class="request-info">
        <strong>${req.name} <span style="font-size: 0.9rem; color: gray;">[${req.type}]</span></strong>
        <small>${req.data.substring(0, 40)}...</small>
      </div>
      <div class="request-actions">
        <button onclick="openModal(${index})">✏️</button>
        <button onclick="deleteRequest(${index})">🗑️</button>
      </div>
    `;
    collectionsList.appendChild(card);
  });
}

function deleteRequest(index) {
  if (!confirm("Are you sure?")) return;
  let saved = JSON.parse(localStorage.getItem("requests") || "[]");
  saved.splice(index, 1);
  localStorage.setItem("requests", JSON.stringify(saved));
  renderRequests();
}

document.getElementById("search").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll(".request-card").forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(term) ? "flex" : "none";
  });
});

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

function loadTheme() {
  const theme = localStorage.getItem("theme");
  if (theme === "dark") document.body.classList.add("dark");
}

loadTheme();
renderRequests();
