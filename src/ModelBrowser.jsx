// src/ModelBrowser.jsx
import { useMemo, useState, useEffect } from "react";

const files = import.meta.glob("./references/**/*.{jpg,jpeg,png}", {
  eager: true,
  import: "default",
});

function buildIndex() {
  const byFolder = new Map();
  Object.entries(files).forEach(([path, url]) => {
    const parts = path.split("/");
    const file = parts.pop();
    const folder = parts.pop();
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder).push({ file, url });
  });
  for (const list of byFolder.values()) {
    list.sort((a, b) =>
      a.file.localeCompare(b.file, undefined, { numeric: true, sensitivity: "base" })
    );
  }
  const folders = Array.from(byFolder.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  return { byFolder, folders };
}

export default function ModelBrowser() {
  const { byFolder, folders } = useMemo(buildIndex, []);
  const [selected, setSelected] = useState(null);     // folder name
  const [lightboxIdx, setLightboxIdx] = useState(-1); // -1 = closed

  // Esc for leaving views
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        if (lightboxIdx !== -1) setLightboxIdx(-1);
        else setSelected(null);
      }
      if (lightboxIdx !== -1) {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, selected]);

  // Prevent background scroll when lightbox is open
  useEffect(() => {
    if (lightboxIdx !== -1) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev);
    }
  }, [lightboxIdx]);

  function openLightbox(i) { setLightboxIdx(i); }
  function closeLightbox() { setLightboxIdx(-1); }
  function next() {
    const arr = byFolder.get(selected) || [];
    setLightboxIdx((i) => (i + 1) % arr.length);
  }
  function prev() {
    const arr = byFolder.get(selected) || [];
    setLightboxIdx((i) => (i - 1 + arr.length) % arr.length);
  }

  if (selected) {
    const images = byFolder.get(selected) || [];

    return (
      <div>
        <div className="back-row">
          <button onClick={() => setSelected(null)}>&larr; Back</button>
          <h2 className="gallery-title">{selected}</h2>
        </div>

        <div className="model-grid">
          {images.map(({ file, url }, i) => (
            <button
              className="model-card model-card--button"
              key={file}
              onClick={() => openLightbox(i)}
              title="Open"
            >
              <div className="thumb-wrap">
                <img src={url} alt={file} />
              </div>
              <div className="model-name">{file}</div>
            </button>
          ))}
        </div>

        {/* LIGHTBOX */}
        {lightboxIdx !== -1 && (
          <div className="lightbox" onClick={closeLightbox} role="dialog" aria-modal="true">
            <button className="lightbox-close" onClick={closeLightbox} aria-label="Close">✕</button>
            <button className="lightbox-nav left" onClick={(e)=>{e.stopPropagation(); prev();}} aria-label="Previous">‹</button>
            <button className="lightbox-nav right" onClick={(e)=>{e.stopPropagation(); next();}} aria-label="Next">›</button>
            <img
              className="lightbox-img"
              src={images[lightboxIdx].url}
              alt={images[lightboxIdx].file}
              onClick={(e) => e.stopPropagation()} // don’t close when clicking the image
            />
          </div>
        )}
      </div>
    );
  }

  // Model grid (first image per folder)
  return (
    <div className="model-grid">
      {folders.map((folder) => {
        const first = byFolder.get(folder)?.[0];
        if (!first) return null;
        return (
          <button
            className="model-card model-card--button"
            key={folder}
            onClick={() => setSelected(folder)}
            title={`Open ${folder}`}
          >
            <div className="thumb-wrap">
              <img src={first.url} alt={folder} />
            </div>
            <div className="model-name">{folder}</div>
          </button>
        );
      })}
    </div>
  );
}
