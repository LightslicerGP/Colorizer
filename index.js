// ----------------------
// 1. CONSTANTS & DOM ELEMENTS
// ----------------------
const LAST_USED_COLOR_KEY = "colorizer-last-used-color";
const SAVED_COLORS_KEY = "colorizer-saved-colors";
// Removed MAX_SAVED_COLORS for unlimited saved colors

const controls = document.getElementById("controls");
const left = document.getElementById("left");
const saveColor = document.getElementById("saveColor");
const saveColorBtn = document.getElementById("saveColorBtn");
const hexInput = document.getElementById("hexValue");
const hslInput = document.getElementById("hslValue");
const hsvInput = document.getElementById("hsvValue");
const rgbInput = document.getElementById("rgbValue");
const savedColorsContainer = document.getElementById("colorSelector") || document.getElementById("savedColors") || null; // This is the display container
const colorLabel = document.getElementById("colorLabel");

// ----------------------
// 2. UTILITIES
// ----------------------

// Contrast: 'black' or 'white' for given hex, for legibility
function getContrastYIQ(hexcolor) {
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) hexcolor = hexcolor.split("").map(c => c + c).join("");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? "black" : "white";
}

// Normalize a hex string (returns #xxxxxx or null)
function normalizeHex(hex) {
    hex = hex.trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split("").map(c => c + c).join("");
    if (/^[0-9a-f]{6}$/i.test(hex)) return "#" + hex.toLowerCase();
    return null;
}

// LocalStorage helpers
function getSavedColors() {
    try {
        const arr = JSON.parse(localStorage.getItem(SAVED_COLORS_KEY));
        if (Array.isArray(arr)) return arr;
    } catch { }
    return [];
}
function saveSavedColors(arr) {
    localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(arr));
}

// ----------------------
// 3. COLOR CONVERSION HELPERS
// ----------------------

// HEX -> RGB Array
function hexToRgb(hex) {
    hex = hex.trim().replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    return [
        parseInt(hex.substr(0, 2), 16),
        parseInt(hex.substr(2, 2), 16),
        parseInt(hex.substr(4, 2), 16)
    ];
}

// RGB Array -> HEX
function rgbToHex(rgb) {
    return (
        "#" +
        rgb.map(x => {
            const s = x.toString(16);
            return s.length === 1 ? "0" + s : s;
        }).join("")
    ).toLowerCase();
}

// RGB Array -> HSL Array
function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return [
        Math.round(h),
        Math.round(s * 100),
        Math.round(l * 100)
    ];
}

// HSL Array -> RGB Array
function hslToRgb([h, s, l]) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = function (p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// RGB Array -> HSV Array
function rgbToHsv([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return [
        Math.round(h),
        Math.round(s * 100),
        Math.round(v * 100)
    ];
}

// HSV Array -> RGB Array
function hsvToRgb([h, s, v]) {
    let r, g, b;
    h = (typeof h === "string") ? parseFloat(h) : h;
    s = (typeof s === "string") ? parseFloat(s) : s;
    v = (typeof v === "string") ? parseFloat(v) : v;
    h = h / 360;
    s = s / 100;
    v = v / 100;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// ----------------------
// 4. PARSERS (for text inputs)
// ----------------------
function parseRgbValue(str) {
    const m = str.match(/\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*/);
    if (!m) return null;
    const arr = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    if (arr.some(x => isNaN(x) || x < 0 || x > 255)) return null;
    return arr;
}
function parseHslValue(str) {
    const m = str.match(/\s*([0-9]{1,3})[°\s,]+\s*([0-9]{1,3})%[,\s]+\s*([0-9]{1,3})%/);
    if (!m) return null;
    const arr = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    if (arr[0] < 0 || arr[0] > 360) return null;
    if (arr[1] < 0 || arr[1] > 100) return null;
    if (arr[2] < 0 || arr[2] > 100) return null;
    return arr;
}
function parseHsvValue(str) {
    const m = str.match(/\s*([0-9]{1,3})[°\s,]+\s*([0-9]{1,3})%[,\s]+\s*([0-9]{1,3})%/);
    if (!m) return null;
    const arr = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    if (arr[0] < 0 || arr[0] > 360) return null;
    if (arr[1] < 0 || arr[1] > 100) return null;
    if (arr[2] < 0 || arr[2] > 100) return null;
    return arr;
}

// ----------------------
// 5. UI (Setters, UI updates, Event Handlers)
// ----------------------

// Set the current color in all input fields and preview label
function setColorInputs(hex, rgb, hsl, hsv) {
    if (hexInput) hexInput.value = hex;
    if (hslInput) hslInput.value = `${hsl[0]}°, ${hsl[1]}%, ${hsl[2]}%`;
    if (hsvInput) hsvInput.value = `${hsv[0]}°, ${hsv[1]}%, ${hsv[2]}%`;
    if (rgbInput) rgbInput.value = `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
    if (colorLabel) colorLabel.textContent = hex.toUpperCase();
}

// Set preview backgrounds and label color appropriately
function applyBackgroundColor(hex) {
    document.body.style.backgroundColor = hex;
    colorLabel.textContent = hex.toUpperCase();
}

// Handle any field input: recalculate/convert and update UI everywhere
function handleFieldChange(e) {
    let hex, rgb, hsl, hsv, ok = true;
    let changedId = e.target.id;

    if (changedId === "hexValue") {
        // Do nothing on input, wait for blur
        return;
    } else if (changedId === "rgbValue") {
        rgb = parseRgbValue(rgbInput.value);
        if (!rgb) ok = false;
    } else if (changedId === "hslValue") {
        hsl = parseHslValue(hslInput.value);
        if (!hsl) ok = false; else rgb = hslToRgb(hsl);
    } else if (changedId === "hsvValue") {
        hsv = parseHsvValue(hsvInput.value);
        if (!hsv) ok = false; else rgb = hsvToRgb(hsv);
    }
    if (!ok) return;

    if (!rgb) rgb = hexToRgb(normalizeHex(hexInput.value));
    if (!rgb) return;
    if (!hex) hex = rgbToHex(rgb);
    if (!hsl) hsl = rgbToHsl(rgb);
    if (!hsv) hsv = rgbToHsv(rgb);

    setColorInputs(hex, rgb, hsl, hsv);
    applyBackgroundColor(hex);
    localStorage.setItem(LAST_USED_COLOR_KEY, hex);
}

// Separate handler for hex input blur (when user leaves input box)
function handleHexInputBlur(e) {
    let hex = normalizeHex(hexInput.value);
    if (!hex) return;
    let rgb = hexToRgb(hex);
    if (!rgb) return;
    let hsl = rgbToHsl(rgb);
    let hsv = rgbToHsv(rgb);
    setColorInputs(hex, rgb, hsl, hsv);
    applyBackgroundColor(hex);
    localStorage.setItem(LAST_USED_COLOR_KEY, hex);
}

// Update the saved colors palette in the DOM
function refreshSavedColorsUI() {
    const colors = getSavedColors();
    if (!savedColorsContainer) return;

    // Clear the container
    savedColorsContainer.innerHTML = "";

    // If you want the palette hidden when empty, apply your removed class (optional)
    if (colors.length === 0) {
        savedColorsContainer.classList.add("removed");
        // Ensure #savedColors also has .removed if present
        const savedColorsDiv = document.getElementById("savedColors");
        if (savedColorsDiv) savedColorsDiv.classList.add("removed");
        return;
    } else {
        savedColorsContainer.classList.remove("removed");
        // Remove .removed from #savedColors if present and there are colors
        const savedColorsDiv = document.getElementById("savedColors");
        if (savedColorsDiv) savedColorsDiv.classList.remove("removed");
    }

    colors.forEach(color => {
        const colorP = document.createElement("p");
        colorP.className = "color";
        colorP.textContent = color.toUpperCase(); // Capitalize HEX code
        colorP.style.background = color;
        colorP.style.color = getContrastYIQ(color);
        colorP.title = "Click to select. Long-press to delete.";
        colorP.tabIndex = 0;
        // Do not style or set display CSS on the container or palette elements

        // Set color as current color when clicked
        colorP.addEventListener("click", () => {
            // Set this color as main
            const hex = normalizeHex(color);
            if (!hex) return;
            const rgb = hexToRgb(hex);
            if (!rgb) return;
            const hsl = rgbToHsl(rgb);
            const hsv = rgbToHsv(rgb);
            setColorInputs(hex, rgb, hsl, hsv);
            applyBackgroundColor(hex);
            try {
                localStorage.setItem(LAST_USED_COLOR_KEY, hex);
            } catch {}
        });

        // Remove color entry on long-press
        if (typeof attachLongPress === 'function') {
            attachLongPress(colorP, (e) => {
                e.preventDefault && e.preventDefault();
                let currentColors = getSavedColors();
                currentColors = currentColors.filter(c => c.toLowerCase() !== color.toLowerCase());
                saveSavedColors(currentColors);
                refreshSavedColorsUI();
                updateColorElBackgrounds();
            });
        }

        savedColorsContainer.appendChild(colorP);
    });
}

// Update background/color of all '.color' palette elements (in case palette was externally changed)
function updateColorElBackgrounds() {
    document.querySelectorAll('.color').forEach(el => {
        const colorText = el.textContent.trim();
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(colorText)) {
            el.style.background = colorText;
            el.style.color = getContrastYIQ(colorText);
        }
    });
}

// Get the initial color for UI (last used or default)
function getInitialColor() {
    let savedColor = null;
    try { savedColor = localStorage.getItem(LAST_USED_COLOR_KEY); } catch { }
    let hex = normalizeHex(savedColor || "");
    if (!hex) {
        hex = "#0080ff";
        try { localStorage.setItem(LAST_USED_COLOR_KEY, hex); } catch { }
    }
    return hex;
}

// Handle color save (from save button)
function handleSaveColor() {
    const newColor = normalizeHex(hexInput.value);
    if (!newColor) {
        hexInput.classList.add("error");
        setTimeout(() => hexInput.classList.remove("error"), 500);
        return;
    }
    let colors = getSavedColors();
    colors = colors.filter(c => c.toLowerCase() !== newColor.toLowerCase());
    colors.unshift(newColor);
    // No MAX_SAVED_COLORS restriction now
    saveSavedColors(colors);
    refreshSavedColorsUI();
    updateColorElBackgrounds();
    localStorage.setItem(LAST_USED_COLOR_KEY, newColor);
}

// ----------------------
// 6. EVENT BINDINGS
// ----------------------

// Field input listeners
if (hexInput) {
    // Don't update color on input, only on blur
    hexInput.addEventListener("input", function () {
        // Optional: visually show error if badly formatted, but don't update color
        // e.g. with a class here, not implemented
    });
    hexInput.addEventListener("blur", handleHexInputBlur);
}
if (rgbInput) rgbInput.addEventListener("input", handleFieldChange);
if (hslInput) hslInput.addEventListener("input", handleFieldChange);
if (hsvInput) hsvInput.addEventListener("input", handleFieldChange);
// Save buttons
if (saveColor && hexInput) saveColor.addEventListener("click", handleSaveColor);
if (saveColorBtn && hexInput) saveColorBtn.addEventListener("click", handleSaveColor);

// Show/hide controls panel
left.addEventListener("click", function (e) {
    if (!controls.classList.contains("open")) {
        controls.classList.add("open");
        left.classList.remove("button");
        e.stopPropagation();
        refreshSavedColorsUI();
        updateColorElBackgrounds();
    }
});
document.addEventListener("click", function (e) {
    if (
        controls.classList.contains("open") &&
        !left.contains(e.target)
    ) {
        controls.classList.remove("open");
        left.classList.add("button");
    }
});

// ----------------------
// 7. INITIALIZATION ON LOAD
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
    refreshSavedColorsUI();
    updateColorElBackgrounds();

    // On popup render, if there are no saved colors, ensure #savedColors has .removed.
    const savedColorsDiv = document.getElementById("savedColors");
    if (savedColorsDiv) {
        const colors = getSavedColors();
        if (!colors.length) {
            savedColorsDiv.classList.add("removed");
        } else {
            savedColorsDiv.classList.remove("removed");
        }
    }

    if (hexInput) {
        let hex = getInitialColor();
        let rgb = hexToRgb(hex);
        let hsl = rgbToHsl(rgb);
        let hsv = rgbToHsv(rgb);
        setColorInputs(hex, rgb, hsl, hsv);
        applyBackgroundColor(hex);
    }
});
