// Logging
function log(msg) {
  console.log(`[live-markdown-viewer] ${new Date().toISOString()} ${msg}`);
}

// Configuration
let mdFile = localStorage.getItem('mdFile') || 'output/example.md';

// Discover .md files in output/ folder
let lastFileList = '';
async function loadFileList() {
  try {
    const res = await fetch('output/');
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = [...doc.querySelectorAll('a')];
    const mdFiles = links.map(a => a.textContent.trim()).filter(f => f.endsWith('.md'));
    const key = mdFiles.join(',');
    if (key === lastFileList) {
      return;
    }
    lastFileList = key;
    if (mdFiles.length > 0 && !mdFiles.includes(mdFile.replace('output/', ''))) {
      mdFile = 'output/' + mdFiles[0];
      localStorage.setItem('mdFile', mdFile);
      load();
    }
    const select = document.getElementById('fileSelect');
    select.innerHTML = mdFiles.map(f =>
      '<option value="output/' + f + '"' + (('output/' + f) === mdFile ? ' selected' : '') + '>' + f + '</option>'
    ).join('');
    if (mdFiles.length === 0) {
      select.innerHTML = '<option>No .md files found</option>';
    }
  } catch (e) {
    document.getElementById('fileSelect').innerHTML = '<option>Error listing files</option>';
  }
}

document.getElementById('fileSelect').addEventListener('change', (e) => {
  mdFile = e.target.value;
  localStorage.setItem('mdFile', mdFile);
  lastMdContent = '';
  load();
});

// Markdown loading
let lastMdContent = '';

async function load() {
  try {
    const res = await fetch(mdFile + '?t=' + Date.now());
    if (!res.ok) {
      document.getElementById('rawContent').textContent = '';
      document.getElementById('renderedContent').innerHTML =
        '<div class="alert alert-warning">File not found: <code>' + mdFile + '</code><br>Drop a markdown file in the <code>output/</code> folder.</div>';
      document.getElementById('status').textContent = 'File not found';
      return;
    }
    const md = await res.text();
    if (md === lastMdContent) {
      log('No changes detected, skipping render');
      return;
    }
    lastMdContent = md;
    const leftPane = document.getElementById('leftPane');
    const rightPane = document.getElementById('rightPane');
    const leftScroll = leftPane.scrollTop;
    const rightScroll = rightPane.scrollTop;
    document.getElementById('rawContent').textContent = md;
    document.getElementById('renderedContent').innerHTML = marked.parse(md);
    document.querySelectorAll('#renderedContent table').forEach(t => t.classList.add('table', 'table-bordered', 'table-sm'));
    // Render Mermaid diagrams: find <code class="language-mermaid"> blocks and replace with rendered SVG
    document.querySelectorAll('#renderedContent code.language-mermaid').forEach((block, i) => {
      const pre = block.parentElement;
      const container = document.createElement('div');
      container.className = 'mermaid';
      container.textContent = block.textContent;
      pre.replaceWith(container);
    });
    if (typeof mermaid !== 'undefined') {
      mermaid.run({ nodes: document.querySelectorAll('#renderedContent .mermaid') });
    }
    // Syntax highlight code blocks (skip mermaid ones)
    document.querySelectorAll('#renderedContent pre code:not(.language-mermaid)').forEach((block) => {
      hljs.highlightElement(block);
    });
    document.getElementById('status').textContent = 'Last loaded: ' + new Date().toLocaleTimeString();
    requestAnimationFrame(() => {
      leftPane.scrollTop = leftScroll;
      rightPane.scrollTop = rightScroll;
    });
  } catch (e) {
    document.getElementById('renderedContent').innerHTML =
      '<div class="alert alert-danger">Error loading file: ' + e.message + '</div>';
    document.getElementById('status').textContent = 'Error';
  }
}

// Auto-refresh with configurable interval
let timer = setInterval(load, 10000);
document.getElementById('interval').addEventListener('change', (e) => {
  clearInterval(timer);
  timer = setInterval(load, parseInt(e.target.value));
});

loadFileList();
setInterval(loadFileList, 30000);
load();

// Resizable divider
const divider = document.getElementById('divider');
const left = document.getElementById('leftPane');
const right = document.getElementById('rightPane');

const savedSplit = localStorage.getItem('splitPercent');
if (savedSplit) {
  left.style.flex = 'none';
  right.style.flex = 'none';
  left.style.width = `calc(${savedSplit}% - ${divider.offsetWidth / 2}px)`;
  right.style.width = `calc(${100 - parseFloat(savedSplit)}% - ${divider.offsetWidth / 2}px)`;
}

divider.addEventListener('mousedown', (e) => {
  e.preventDefault();
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', () => document.removeEventListener('mousemove', resize), { once: true });
});

function resize(e) {
  const container = divider.parentElement;
  const offset = e.clientX - container.getBoundingClientRect().left;
  const total = container.clientWidth;
  const percent = (offset / total) * 100;
  const dividerWidth = divider.offsetWidth;
  left.style.flex = 'none';
  right.style.flex = 'none';
  left.style.width = `calc(${percent}% - ${dividerWidth / 2}px)`;
  right.style.width = `calc(${100 - percent}% - ${dividerWidth / 2}px)`;
  localStorage.setItem('splitPercent', percent);
}

// Theme management - single handler for Bootstrap, highlight.js, and Mermaid
function applyTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  document.getElementById('hljsTheme').href = theme === 'dark' ? 'hljs-github-dark.min.css' : 'hljs-github.min.css';
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: false, theme: theme === 'dark' ? 'dark' : 'default' });
  }
}

const theme = localStorage.getItem('theme') || 'light';
applyTheme(theme);
document.getElementById('themeToggle').value = theme;

document.getElementById('themeToggle').addEventListener('change', (e) => {
  localStorage.setItem('theme', e.target.value);
  applyTheme(e.target.value);
  load();
});

// Copy buttons
document.getElementById('copyRaw').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('rawContent').textContent);
  document.getElementById('copyRaw').textContent = 'Copied!';
  setTimeout(() => document.getElementById('copyRaw').textContent = 'Copy', 1500);
});

document.getElementById('copyRendered').addEventListener('click', () => {
  const html = document.getElementById('renderedContent').innerHTML;
  const blob = new Blob([html], { type: 'text/html' });
  navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
  document.getElementById('copyRendered').textContent = 'Copied!';
  setTimeout(() => document.getElementById('copyRendered').textContent = 'Copy', 1500);
});
