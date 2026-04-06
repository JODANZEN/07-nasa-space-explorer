// NASA Space Explorer

const startInput = document.getElementById("startDate");
const endInput = document.getElementById("endDate");
const gallery = document.getElementById("gallery");
const button = document.querySelector(".filters button");

const API_KEY = "1G8nSIBqvR0CoJ7cpyJBMXftQ24y3Iz8vn1NRibU";

const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "There are more trees on Earth than stars in the Milky Way.",
  "Neutron stars can spin up to hundreds of times per second.",
  "One teaspoon of neutron star matter would weigh billions of tons.",
  "Light from the Sun takes about 8 minutes to reach Earth.",
  "Saturn is so low-density that it could float in a giant bathtub of water.",
  "Olympus Mons on Mars is the tallest volcano in the solar system.",
  "The Moon is drifting away from Earth by about 1.5 inches each year."
];

let modalEl = null;

setupDateInputs(startInput, endInput);

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function pickRandomFact() {
  return spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
}

function injectTopContent() {
  const header = document.querySelector(".site-header");
  if (!header || document.querySelector(".space-fact")) return;

  const intro = document.createElement("section");
  intro.className = "hero-strip";
  intro.innerHTML = `
    <div class="hero-strip__eyebrow">NASA APOD Gallery</div>
    <h2 class="hero-strip__title">Explore the universe by date range</h2>
    <p class="hero-strip__text">
      Browse NASA’s Astronomy Picture of the Day archive, open each entry for full details,
      and enjoy a clean mission-control style layout.
    </p>
  `;

  const fact = document.createElement("section");
  fact.className = "space-fact";
  fact.innerHTML = `
    <div class="space-fact__label">Did You Know?</div>
    <p>${pickRandomFact()}</p>
  `;

  header.insertAdjacentElement("afterend", intro);
  intro.insertAdjacentElement("afterend", fact);
}

function setGalleryMessage(icon, title, text, extraClass = "") {
  gallery.innerHTML = `
    <div class="placeholder ${extraClass}">
      <div class="placeholder-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${text}</p>
    </div>
  `;
}

function showIdleState() {
  setGalleryMessage(
    "🛰️",
    "Ready for launch",
    'Pick a date range and click “Get Space Images” to load NASA APOD entries.'
  );
}

function showLoadingState() {
  setGalleryMessage(
    "🔄",
    "Loading space photos…",
    "Fetching the latest APOD entries from NASA."
  );
}

function showErrorState(message) {
  setGalleryMessage("⚠️", "Something went wrong", message, "error-state");
}

function showEmptyState() {
  setGalleryMessage(
    "🌌",
    "No results found",
    "NASA did not return any APOD entries for that date range."
  );
}

function getVideoEmbedUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "").split("/")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        const videoId = parsed.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return url;
      }
    }
  } catch {
    // Ignore invalid URL and fall back to a link/thumbnail
  }

  return "";
}

function getPreviewSrc(item) {
  if (item.media_type === "image") return item.url || "";
  if (item.media_type === "video") return item.thumbnail_url || "";
  return "";
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "gallery-item";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open details for ${item.title}`);

  const previewSrc = getPreviewSrc(item);

  const mediaWrap = document.createElement("div");
  mediaWrap.className = "gallery-item__media";

  if (previewSrc) {
    const img = document.createElement("img");
    img.src = previewSrc;
    img.alt = item.title;
    img.loading = "lazy";
    mediaWrap.appendChild(img);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "video-fallback";
    fallback.innerHTML = `
      <div class="video-fallback__icon">▶</div>
      <div class="video-fallback__text">Video Entry</div>
    `;
    mediaWrap.appendChild(fallback);
  }

  const badge = document.createElement("span");
  badge.className = `media-badge ${
    item.media_type === "video" ? "media-badge--video" : "media-badge--image"
  }`;
  badge.textContent = item.media_type === "video" ? "Video" : "Image";
  mediaWrap.appendChild(badge);

  const body = document.createElement("div");
  body.className = "gallery-item__body";

  const title = document.createElement("h3");
  title.textContent = item.title;

  const date = document.createElement("p");
  date.className = "photo-date";
  date.textContent = formatDate(item.date);

  const snippet = document.createElement("p");
  snippet.className = "gallery-item__snippet";
  snippet.textContent = item.explanation
    ? `${item.explanation.slice(0, 130)}${item.explanation.length > 130 ? "…" : ""}`
    : "Click to read more.";

  body.appendChild(title);
  body.appendChild(date);
  body.appendChild(snippet);

  card.appendChild(mediaWrap);
  card.appendChild(body);

  card.addEventListener("click", () => openModal(item));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(item);
    }
  });

  return card;
}

function renderGallery(items) {
  gallery.innerHTML = "";

  if (!items || !items.length) {
    showEmptyState();
    return;
  }

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  const fragment = document.createDocumentFragment();

  sorted.forEach((item) => fragment.appendChild(createCard(item)));
  gallery.appendChild(fragment);
}

function buildDateList(startDate, endDate) {
  const dates = [];
  const current = new Date(`${startDate}T00:00:00`);
  const last = new Date(`${endDate}T00:00:00`);

  while (current <= last) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

async function fetchAPODByDate(dateString) {
  const url =
    `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(API_KEY)}` +
    `&date=${encodeURIComponent(dateString)}` +
    `&thumbs=true`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NASA APOD failed for ${dateString}: ${response.status}`);
  }

  return await response.json();
}

async function fetchAPOD() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  const rangeUrl =
    `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(API_KEY)}` +
    `&start_date=${encodeURIComponent(startDate)}` +
    `&end_date=${encodeURIComponent(endDate)}` +
    `&thumbs=true`;

  try {
    const response = await fetch(rangeUrl);

    if (!response.ok) {
      throw new Error(`NASA API request failed: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (rangeError) {
    console.warn("Range request failed, falling back to daily requests:", rangeError);

    const dates = buildDateList(startDate, endDate);
    const results = [];

    for (const date of dates) {
      try {
        const item = await fetchAPODByDate(date);
        results.push(item);
      } catch (dayError) {
        console.warn(`Skipping ${date}:`, dayError);
      }
    }

    return results;
  }
}

async function loadGallery() {
  const originalText = button.textContent;

  try {
    button.disabled = true;
    button.textContent = "Loading...";
    showLoadingState();

    const items = await fetchAPOD();
    renderGallery(items);
  } catch (error) {
    console.error(error);
    showErrorState(
      "The APOD data could not be loaded. Check your API key, network connection, and try again."
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function ensureModal() {
  if (modalEl) return modalEl;

  modalEl = document.createElement("div");
  modalEl.className = "modal";
  modalEl.innerHTML = `
    <div class="modal__backdrop" data-close="true"></div>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <button class="modal__close" type="button" aria-label="Close modal" data-close="true">×</button>

      <div class="modal__media">
        <img class="modal__image" alt="" />
        <iframe class="modal__iframe" title="NASA APOD video" allowfullscreen></iframe>
      </div>

      <div class="modal__content">
        <div class="modal__eyebrow">NASA APOD</div>
        <h2 id="modalTitle"></h2>
        <p class="modal__date"></p>
        <p class="modal__explanation"></p>
        <a class="modal__link" target="_blank" rel="noopener noreferrer"></a>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  modalEl.addEventListener("click", (event) => {
    if (event.target.dataset.close === "true") {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modalEl.classList.contains("is-open")) {
      closeModal();
    }
  });

  return modalEl;
}

function openModal(item) {
  const modal = ensureModal();

  const title = modal.querySelector("#modalTitle");
  const date = modal.querySelector(".modal__date");
  const explanation = modal.querySelector(".modal__explanation");
  const link = modal.querySelector(".modal__link");
  const image = modal.querySelector(".modal__image");
  const iframe = modal.querySelector(".modal__iframe");

  title.textContent = item.title;
  date.textContent = formatDate(item.date);
  explanation.textContent = item.explanation || "No description available.";
  link.href = item.url || "#";

  if (item.media_type === "video") {
    const embedUrl = getVideoEmbedUrl(item.url);

    if (embedUrl) {
      image.style.display = "none";
      image.removeAttribute("src");

      iframe.style.display = "block";
      iframe.src = embedUrl;
      link.textContent = "Open video on NASA";
    } else {
      iframe.style.display = "none";
      iframe.removeAttribute("src");

      if (item.thumbnail_url) {
        image.src = item.thumbnail_url;
        image.alt = item.title;
        image.style.display = "block";
      } else {
        image.style.display = "none";
        image.removeAttribute("src");
      }

      link.textContent = "Open video on NASA";
    }
  } else {
    iframe.style.display = "none";
    iframe.removeAttribute("src");

    image.src = item.hdurl || item.url;
    image.alt = item.title;
    image.style.display = "block";
    link.textContent = "Open image on NASA";
  }

  modal.classList.add("is-open");
  document.body.classList.add("no-scroll");
}

function closeModal() {
  if (!modalEl) return;

  modalEl.classList.remove("is-open");
  document.body.classList.remove("no-scroll");

  const iframe = modalEl.querySelector(".modal__iframe");
  if (iframe) iframe.src = "";
}

button.addEventListener("click", loadGallery);

[startInput, endInput].forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      loadGallery();
    }
  });
});

injectTopContent();
showIdleState();