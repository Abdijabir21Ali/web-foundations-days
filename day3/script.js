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

console.log(searchNotes("milk"));       
console.log(searchNotes("zzz"));        

console.log(longestNote());             
console.log(longestNote.call(null));    

console.log(countByCategory());         
console.log(countByCategory());         

console.log(getSummary());              
console.log(getSummary());              

console.log(isDuplicate("Buy milk and bread"));
console.log(isDuplicate("buy milk and bread")); 
console.log(isDuplicate("something new"));      

console.log(addNote("New note", "study"));      
console.log(addNote("Buy milk and bread", "work")); 
console.log(addNote("", "work"));               
console.log(addNote("Valid text", "other"));    
