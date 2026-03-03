# A Notes App v3

## Running the Server

```bash
pip install flask flask-cors
python app.py
```

Server runs on `http://0.0.0.0:2142` by default.

## Frontend Setup (Vite)

```bash
npm create vite@latest . -- --template react
npm install
npm run dev
```

## Features

- **ToDo Lists** — Multiple workspaces, collapsible lists, inline editing
- **Notes Canvas** — 5000×5000 infinite canvas, pan + zoom, draggable notes, resizable notes, markdown + image support (including during creation)
- **Kanban** — Drag-and-drop cards between columns via HTML5 DnD API
- **Settings** — Theme (dark/light/midnight), accent color, font size, canvas speeds, cloud sync
- **Export/Import** — `.ana` file format (JSON)
- **Cloud Sync** — Login/register with the Flask server, upload/download data

## Notes Canvas Controls

- **Drag** to pan the canvas
- **Alt + Scroll** or **Ctrl + Scroll** to zoom
- **Drag note header** to move notes
- **Drag SE corner** to resize notes
- **Double-click workspace name** in sidebar to rename
