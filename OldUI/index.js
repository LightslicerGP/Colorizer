// Show the div only if user touches/clicks for 3 seconds
const menu = document.getElementById("menu");
let pressTimer = null;

function showDivAfterDelay(e) {
    // Prevent multiple timers
    if (pressTimer !== null) return;
    pressTimer = setTimeout(() => {
        menu.classList.remove("hidden");
    }, 1000);
}

function clearPressTimer(e) {
    if (pressTimer !== null) {
        clearTimeout(pressTimer);
        pressTimer = null;
    }
}

// Mouse events
document.addEventListener("mousedown", showDivAfterDelay);
document.addEventListener("mouseup", clearPressTimer);
document.addEventListener("mouseleave", clearPressTimer);

// Touch events
document.addEventListener("touchstart", showDivAfterDelay);
document.addEventListener("touchend", clearPressTimer);
document.addEventListener("touchcancel", clearPressTimer);

// Hide menu when clicking/tapping outside of it
function hideMenuOnOutsideClick(e) {
    if (menu.classList.contains("hidden")) return;
    // If the click/tap is not inside the menu, hide it
    if (!menu.contains(e.target)) {
        menu.classList.add("hidden");
    }
}
document.addEventListener("mousedown", hideMenuOnOutsideClick);
document.addEventListener("touchstart", hideMenuOnOutsideClick);

// Hex color input logic: change background color of body and cache the color
const hexInput = document.getElementById("hex-color-input");
const hexError = document.getElementById("hex-color-error");
const setColorBtn = document.getElementById("set-color-btn");
const deleteRecentBtn = document.getElementById("delete-recent-btn");
const colorHistoryList = document.getElementById("color-history-list");

// Helper: validate hex color (accepts with or without #)
function isValidHex(hex) {
    return /^#?[A-Fa-f0-9]{6}$/.test(hex);
}

// Helper: normalize hex to always start with #
function normalizeHex(hex) {
    hex = hex.trim();
    if (!hex.startsWith("#")) {
        hex = "#" + hex;
    }
    return hex;
}

// Color history logic
const COLOR_HISTORY_KEY = "colorizer-history";
const COLORIZER_COLOR_KEY = "colorizer-color";
const MAX_HISTORY = 10;

function getColorHistory() {
    try {
        const arr = JSON.parse(localStorage.getItem(COLOR_HISTORY_KEY));
        if (Array.isArray(arr)) return arr;
    } catch { }
    return [];
}

function saveColorHistory(arr) {
    localStorage.setItem(COLOR_HISTORY_KEY, JSON.stringify(arr));
}

function addColorToHistory(hex) {
    hex = normalizeHex(hex);
    let history = getColorHistory();
    // Remove if already exists (case-insensitive)
    history = history.filter((c) => c.toLowerCase() !== hex.toLowerCase());
    history.unshift(hex);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    saveColorHistory(history);
    renderColorHistory();
}

function renderColorHistory() {
    const history = getColorHistory();
    colorHistoryList.innerHTML = "";
    if (history.length === 0) {
        colorHistoryList.innerHTML = "<span style='color:#808080'>No colors yet.</span>";
        deleteRecentBtn.disabled = true;
        return;
    }
    history.forEach((hex) => {
        const item = document.createElement("div");
        item.className = "color-history-item";
        item.title = "Click to use this color";
        item.tabIndex = 0;
        item.innerHTML = `<span class="color-history-swatch" style="background:${hex}"></span> <span>${hex}</span>`;
        item.addEventListener("click", () => {
            hexInput.value = hex;
            setColor(hex);
        });
        item.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                hexInput.value = hex;
                setColor(hex);
            }
        });
        colorHistoryList.appendChild(item);
    });
    deleteRecentBtn.disabled = false;
}

// Set color and update UI/history
function setColor(hex) {
    if (!isValidHex(hex)) {
        hexInput.classList.add("invalid");
        hexError.classList.add("visible");
        return;
    }
    const normalizedHex = normalizeHex(hex);
    document.body.style.backgroundColor = normalizedHex;
    localStorage.setItem(COLORIZER_COLOR_KEY, normalizedHex);
    hexInput.classList.remove("invalid");
    hexError.classList.remove("visible");
    addColorToHistory(normalizedHex);
}

// Delete the most recent color from history
function deleteRecentColor() {
    let history = getColorHistory();
    if (history.length === 0) return;
    history.shift();
    saveColorHistory(history);
    renderColorHistory();
}

// On load, restore color from localStorage if available
const savedColor = localStorage.getItem(COLORIZER_COLOR_KEY);
if (savedColor && isValidHex(savedColor)) {
    document.body.style.backgroundColor = normalizeHex(savedColor);
    hexInput.value = normalizeHex(savedColor);
}

// On load, render color history
renderColorHistory();

// Set Color button logic
setColorBtn.addEventListener("click", () => {
    const val = hexInput.value.trim();
    setColor(val);
});

// Delete Recent button logic
deleteRecentBtn.addEventListener("click", () => {
    deleteRecentColor();
});

// Enable/disable Set Color button based on input validity
function updateSetColorBtnState() {
    setColorBtn.disabled = !isValidHex(hexInput.value.trim());
}
hexInput.addEventListener("input", () => {
    updateSetColorBtnState();
    // Optionally, clear error on input
    if (isValidHex(hexInput.value.trim())) {
        hexInput.classList.remove("invalid");
        hexError.classList.remove("visible");
    }
});
updateSetColorBtnState();

// Also update on blur (in case user pastes or leaves field)
hexInput.addEventListener("blur", () => {
    updateSetColorBtnState();
});

// Optionally, allow pressing Enter to apply color and blur
hexInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        setColorBtn.click();
        hexInput.blur();
    }
});

// Optionally, allow pressing Space on Set Color button
setColorBtn.addEventListener("keydown", function (e) {
    if (e.key === " " || e.key === "Enter") {
        setColorBtn.click();
    }
});

// Optionally, allow pressing Space or Enter on Delete Recent button
deleteRecentBtn.addEventListener("keydown", function (e) {
    if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        deleteRecentBtn.click();
    }
});