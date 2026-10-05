// script.js — senior developer, exact spec
// Select all required elements
const noteText = document.getElementById('note-text');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');

// ------------------------------------------------------------
// updateCounts() — updates both counters and warning/over classes
// ------------------------------------------------------------
function updateCounts() {
    const text = noteText.value;
    const charLength = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    // character display: "N / 200 characters"
    charCount.textContent = `${charLength} / 200 characters`;
    // word display: "N words"
    wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;

    // Manage warning & over classes on the character counter paragraph
    charCount.classList.remove('warning', 'over');

    if (charLength > 200) {
        charCount.classList.add('over');
    } else if (charLength > 180) {
        charCount.classList.add('warning');
    }
}

// ------------------------------------------------------------
// Save draft to localStorage
// ------------------------------------------------------------
function saveDraft() {
    localStorage.setItem('noteDraft', noteText.value);
}

// ------------------------------------------------------------
// Clear everything: textarea, counters, draft, and classes
// ------------------------------------------------------------
function clearAll() {
    noteText.value = '';
    localStorage.removeItem('noteDraft');
    updateCounts();               // resets counters to 0 and removes warning/over
    noteText.focus();
}

// ------------------------------------------------------------
// Theme handling: toggle dark class, update button label, persist
// ------------------------------------------------------------
function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark');
        themeToggle.textContent = 'Light mode';
    } else {
        document.body.classList.remove('dark');
        themeToggle.textContent = 'Dark mode';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ------------------------------------------------------------
// Restore draft and theme on page load
// ------------------------------------------------------------
function restoreFromStorage() {
    // restore draft text
    const savedDraft = localStorage.getItem('noteDraft');
    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    // restore theme (default: light if nothing stored)
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = savedTheme === 'dark';
    // Apply theme without toggling again — just set class & label
    if (prefersDark) {
        document.body.classList.add('dark');
        themeToggle.textContent = 'Light mode';
    } else {
        document.body.classList.remove('dark');
        themeToggle.textContent = 'Dark mode';
    }

    // Always update counters after restoring text
    updateCounts();
}

// ------------------------------------------------------------
// Event listeners
// ------------------------------------------------------------

// 1. input event: update counts + save draft
noteText.addEventListener('input', () => {
    updateCounts();
    saveDraft();
});

// 2. Clear button click → clears everything
clearBtn.addEventListener('click', clearAll);

// 3. Escape key inside textarea → also clears everything
noteText.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        e.preventDefault();   // avoid any default (e.g., blur)
        clearAll();
    }
});

// 4. Theme toggle button
themeToggle.addEventListener('click', toggleTheme);

// ------------------------------------------------------------
// Initialise on page load: restore saved draft & theme, then update counts
// ------------------------------------------------------------
restoreFromStorage();

// (updateCounts is already called inside restoreFromStorage,
//  but we call it again for absolute clarity – no harm, no missing spec)
updateCounts();