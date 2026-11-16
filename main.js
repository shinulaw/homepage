// Clock, links and the field. LINKS comes from links.js.
const clock = document.querySelector('#clock');
const date = document.querySelector('#date');
const input = document.querySelector('#q');

const pad = (n) => String(n).padStart(2, '0');
const part = (now, options) => now.toLocaleDateString('en-US', options);

// The greeter's formats: "HH:mm" and "dddd d MMMM".
function drawClock() {
  const now = new Date();
  clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  date.textContent = `${part(now, { weekday: 'long' })} ${now.getDate()} ${part(now, { month: 'long' })}`;
  return now;
}

function runClock() {
  const now = drawClock();
  // Again just after the minute changes.
  setTimeout(runClock, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
}

runClock();
// Timers are throttled in background tabs; catch up when the tab is shown.
document.addEventListener('visibilitychange', drawClock);

const anchors = LINKS.map(({ name, url }) => {
  const a = document.createElement('a');
  a.href = url;
  a.textContent = name;
  return a;
});
document.querySelector('#links').append(...anchors);

let matches = anchors;
let selected = -1;

const typed = () => input.value.trim();
const google = () => `https://www.google.com/search?q=${encodeURIComponent(typed())}`;

// Where Enter goes: the selected link; without one, the typed text as an
// address when it looks like one (no spaces, has a dot), else a search.
function target() {
  if (matches[selected]) return matches[selected].href;
  const text = typed();
  if (text === '') return null;
  if (/^\S+\.\S+$/.test(text)) return /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  return google();
}

function paint() {
  for (const a of anchors) a.classList.toggle('selected', a === matches[selected]);
}

function filter() {
  const query = typed().toLowerCase();
  matches = anchors.filter((a) => a.textContent.includes(query));
  for (const a of anchors) a.classList.toggle('miss', !matches.includes(a));
  // Nothing is selected until something is typed or the selection is moved.
  selected = query !== '' && matches.length > 0 ? 0 : -1;
  paint();
}

function move(step) {
  if (matches.length === 0) return;
  selected = Math.max(0, Math.min(matches.length - 1, selected + step));
  paint();
}

input.addEventListener('input', filter);

// The keys of the desktop menu (Menu.qml), minus Ctrl+N and Ctrl+P, which
// Firefox keeps for itself.
input.addEventListener('keydown', (event) => {
  const key = event.key;
  const ctrl = event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey ? key.toLowerCase() : '';
  if (key === 'Escape') {
    input.value = '';
    filter();
  } else if (key === 'Enter') {
    // Shift+Enter searches for the text as typed, whatever is selected.
    const url = event.shiftKey && typed() !== '' ? google() : target();
    if (url) location.assign(url);
  } else if (key === 'ArrowDown' || (key === 'Tab' && !event.shiftKey) || ctrl === 'j') {
    move(1);
  } else if (key === 'ArrowUp' || (key === 'Tab' && event.shiftKey) || ctrl === 'k') {
    move(-1);
  } else {
    return;
  }
  event.preventDefault();
});
