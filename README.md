# Live Markdown Viewer

A lightweight split-pane markdown viewer with live reload. Raw markdown on the left, rendered on the right, with a resizable divider.

## Quick Start

```bash
# 1. Drop your .md files into output/
cp my-doc.md output/

# 2. Serve with any static file server that supports directory listing
python3 -m http.server 8080 --bind 127.0.0.1

# 3. Open http://localhost:8080
```

The UI auto-discovers `.md` files in `output/` via the server's directory listing.

## Features

- Split pane: raw markdown (left) + rendered (right)
- File selector dropdown (auto-discovers .md files in output/)
- Resizable center divider (drag to resize)
- Configurable auto-refresh interval (5s/10s/30s/60s)
- Bootstrap-styled tables
- Graceful error handling when file not found
- Zero build step

## How It Works

The viewer fetches `GET /output/` which returns the server's HTML directory listing. It parses the `<a>` tags to find `.md` files and populates the dropdown. Content auto-refreshes at the selected interval with cache-busting.

## Vendored Libraries

| Library | Version | License |
|---------|---------|---------|
| [marked.js](https://github.com/markedjs/marked) | 15.0.12 | MIT |
| [Bootstrap](https://getbootstrap.com/) | 5.3.3 | MIT |

## File Structure

```
live-markdown-viewer/
  index.html
  app.js
  marked.min.js
  bootstrap.min.css
  README.md
  .gitignore
  output/           <- gitignored, put your .md files here
```
