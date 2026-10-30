# Live Markdown Viewer

A lightweight split-pane markdown viewer with live reload. Raw markdown on the left, rendered on the right, with a resizable divider.

**Live demo:** https://ravikiranj.github.io/live-markdown-viewer/

## Quick Start

```bash
# 1. Drop your .md files into output/
cp my-doc.md output/

# 2. Serve with any static file server that supports directory listing
python3 -m http.server 8080 --bind 127.0.0.1

# 3. Open http://localhost:8080
```

The UI auto-discovers `.md` files in `output/` via the server's directory listing.

### Sharing a direct link

The URL stays in sync with the file picker and theme/reload dropdowns, so the address bar is always a complete, shareable
link: `?file=my-doc.md&theme=dark&reload=30000` (`file` also accepts the `output/` prefix). Precedence per
setting: URL param > last value saved in this browser > built-in default. An unrecognized `theme`/`reload` value
is ignored rather than applied.

## Features

- Split pane: raw markdown (left) + rendered (right)
- Searchable file picker, sorted by name (auto-discovers .md files in output/)
- Shareable URL (`?file=`, `?theme=`, `?reload=`), synced with the dropdowns
- Resizable center divider (drag to resize)
- Configurable auto-refresh interval (5s/10s/30s/60s)
- Bootstrap-styled tables
- Graceful error handling when file not found
- Zero build step

## How It Works

The viewer fetches `GET /output/` which returns the server's HTML directory listing. It parses the `<a>` tags to find `.md` files and sorts them by name, and populates the file picker. Typing in the picker's search box filters the list (every word must match, case-insensitive). The button shows the current file name even when the listing is unavailable, for example on static hosting. Content auto-refreshes at the selected interval with cache-busting.

> **Note:** The raw markdown pane is a read-only view, not an editor. The viewer polls the source file on disk and overwrites both panes on every refresh, so anything typed into the UI is discarded on the next reload. Edit the `.md` file on disk (with your editor or an external agent) and the changes appear in the viewer automatically.

## Vendored Libraries

| Library | Version | License |
|---------|---------|---------|
| [marked.js](https://github.com/markedjs/marked) | 15.0.12 | MIT |
| [Bootstrap](https://getbootstrap.com/) (CSS + bundle JS, used for the file picker dropdown) | 5.3.8 | MIT |
| [Popper](https://popper.js.org/) (bundled inside `bootstrap.bundle.min.js`) | as bundled with Bootstrap 5.3.8 | MIT |
| [highlight.js](https://highlightjs.org/) | 11.9.0 | BSD-3-Clause |
| highlight.js GitHub themes (`hljs-github.min.css`, `hljs-github-dark.min.css`) | 11.9.0 | BSD-3-Clause |
| [Mermaid](https://mermaid.js.org/) | see file header | MIT |

## File Structure

```
live-markdown-viewer/
  index.html
  app.js
  marked.min.js
  highlight.min.js
  mermaid.min.js
  bootstrap.min.css
  bootstrap.bundle.min.js
  hljs-github.min.css
  hljs-github-dark.min.css
  README.md
  .gitignore
  output/           <- gitignored, put your .md files here
```
