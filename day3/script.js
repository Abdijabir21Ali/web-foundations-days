let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// searchNotes(word): filter, toLowerCase, includes
function searchNotes(word) {
  return notes.filter(note => note.text.toLowerCase().includes(word.toLowerCase()));
}

// longestNote(): handle empty array first, then compare lengths
function longestNote() {
  if (notes.length === 0) return null;
  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

// countByCategory(): loop over notes, increase counter in an object
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

// getSummary(): use countByCategory and template literal, "note" for one, "notes" otherwise
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const word = total === 1 ? "note" : "notes";
  return `${total} ${word}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

// isDuplicate(text): use some, comparing trimmed lower-case text
function isDuplicate(text) {
  return notes.some(note => note.text.trim().toLowerCase() === text.trim().toLowerCase());
}

// addNote(text, category): call isDuplicate, check length and category before adding
function addNote(text, category) {
  if (text.length < 1 || text.length > 200) {
    console.log("Text must be 1–200 characters.");
    return false;
  }
  if (isDuplicate(text)) {
    console.log("Duplicate note.");
    return false;
  }
  if (category !== "personal" && category !== "work" && category !== "study") {
    console.log("Category must be personal, work, or study.");
    return false;
  }
  notes.push({ id: notes.length + 1, text: text, category: category });
  return true;
}

// Tests: at least two console.log calls per function, expected output in comments

console.log(searchNotes("milk"));       // [ { id: 1, text: "Buy milk and bread", category: "personal" } ]
console.log(searchNotes("zzz"));        // []

console.log(longestNote());             // { id: 3, text: "Email the project report to Grace", category: "work" }
console.log(longestNote.call(null));    // same result (edge case: function re-run)

console.log(countByCategory());         // { personal: 2, work: 1, study: 2 }
console.log(countByCategory());         // same (edge case: re-run)

console.log(getSummary());              // "5 notes: 2 personal, 1 work, 2 study."
console.log(getSummary());              // same (edge case: re-run)

console.log(isDuplicate("Buy milk and bread")); // true
console.log(isDuplicate("buy milk and bread")); // true (case-insensitive)
console.log(isDuplicate("something new"));      // false (edge case)

console.log(addNote("New note", "study"));      // true
console.log(addNote("Buy milk and bread", "work")); // false (duplicate)
console.log(addNote("", "work"));               // false (too short)
console.log(addNote("Valid text", "other"));    // false (invalid category)
