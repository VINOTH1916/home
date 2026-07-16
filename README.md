# 🏠 Dream Home — Tile & Design Gallery

A beautiful static gallery website showcasing tile selections for every part of the home.

## 📁 Folder Structure

```
home/
├── index.html          ← Main website
├── style.css           ← All styling
├── gallery.js          ← Gallery & lightbox logic
├── images.json         ← Image manifest (update when adding images)
└── images/
    ├── surface/        ← Floor surface tile images
    ├── portioSurface/  ← Portico surface tile images
    ├── bathroom/       ← Bathroom tile images
    ├── potioWall/      ← Patio wall tile images
    ├── outdoor/        ← Outdoor/exterior tile images
    └── kitchen/        ← Kitchen tile images
```

## 🖼️ How to Add Images

1. Copy your images into the appropriate folder inside `images/`
2. Open `images.json` and add the filenames:

```json
{
  "surface":       ["tile1.jpg", "tile2.jpg", "tile3.png"],
  "portioSurface": ["entry1.jpg"],
  "bathroom":      ["bath1.jpg", "bath2.jpg"],
  "potioWall":     ["wall1.jpg"],
  "outdoor":       ["ext1.jpg", "ext2.jpg"],
  "kitchen":       ["kitchen1.jpg"]
}
```

3. Commit and push — GitHub Pages will show your images automatically.

## 🚀 Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, root `/`
4. Your site will be live at `https://<username>.github.io/<repo-name>`

## ✨ Features

- Horizontal scrollable galleries per category
- Click any tile image to open full-size lightbox
- Arrow keys & swipe to navigate in lightbox
- Sticky nav pills that highlight the current section
- Fully responsive — works on mobile & desktop
