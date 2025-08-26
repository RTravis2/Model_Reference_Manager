import { useMemo, useState, useEffect, useRef } from "react";

// Pull all images under /references (any depth)
const files = import.meta.glob("./references/**/*.{jpg,jpeg,png,JPG,JPEG,PNG,webp,WEBP,avif,AVIF}", {
  eager: true,
  import: "default",
});

/**
 * Build a 3-level index:
 * byType: Map<type, Map<model, { cover?: {file,url}, categories: Map<category, Array<{file,url}>> }>>
 * types:  string[]                   // sorted list of types (top-level folders under /references)
 * models: Map<type, string[]>        // sorted list of model names per type
 */
function buildIndex() {
  const byType = new Map();                 // Map<string, Map<string, {cover?, categories: Map<string, Array<{file,url}>>}>>
  const typeNames = new Set();

  Object.entries(files).forEach(([path, url]) => {
    const parts = path.split("/").filter(Boolean);
    const iRef = parts.indexOf("references");

    const type = (parts[iRef + 1] || "uncategorized").toLowerCase(); // top-level under /references
    const model = parts[iRef + 2] || "Unknown Model";
    const category = (parts[iRef + 3] || "uncategorized").toLowerCase();
    const file = parts[parts.length - 1];

    if (!byType.has(type)) byType.set(type, new Map());
    const typeMap = byType.get(type);

    if (!typeMap.has(model)) typeMap.set(model, { cover: undefined, categories: new Map() });
    const entry = typeMap.get(model);

    if (category === "thumbnail") {
      if (!entry.cover) entry.cover = { file, url };
    } else {
      if (!entry.categories.has(category)) entry.categories.set(category, []);
      entry.categories.get(category).push({ file, url });
    }

    typeNames.add(type);
  });

  // Sort files inside each category
  for (const typeMap of byType.values()) {
    for (const { categories } of typeMap.values()) {
      for (const list of categories.values()) {
        list.sort((a, b) =>
          a.file.localeCompare(b.file, undefined, { numeric: true, sensitivity: "base" })
        );
      }
    }
  }

  // Sorted lists
  const types = Array.from(typeNames).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

  const models = new Map();
  for (const [type, typeMap] of byType.entries()) {
    const modelList = Array.from(typeMap.keys()).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
    models.set(type, modelList);
  }

  return { byType, types, models };
}

export default function ModelBrowser() {
  const { byType, types, models } = useMemo(buildIndex, []);
  const [selectedType, setSelectedType] = useState("all");     // landing filter: 'all' or a specific type
  const [selected, setSelected] = useState(null);              // { type, model } or null
  const [activeCategory, setActiveCategory] = useState("all"); // within a model
  const [lightboxIdx, setLightboxIdx] = useState(-1);

  // --- ZOOM/PAN state for lightbox ---
  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [panning, setPanning] = useState(false);
  const panRef = useRef({ x: 0, y: 0 });

  function resetZoom() {
    setScale(1);
    setTx(0);
    setTy(0);
    setPanning(false);
  }

  // Reset zoom when closing lightbox or switching images
  useEffect(() => {
    if (lightboxIdx === -1) resetZoom();
  }, [lightboxIdx]);
  // Also reset when the image array (selection/filter) changes under the same index
  useEffect(() => {
    resetZoom();
  }, [selected, activeCategory]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        if (lightboxIdx !== -1) setLightboxIdx(-1);
        else if (selected) {
          setSelected(null);
          setActiveCategory("all");
        }
      }
      if (lightboxIdx !== -1) {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
        if (e.key === "+") zoomIn();
        if (e.key === "-") zoomOut();
        if (e.key.toLowerCase() === "f") resetZoom(); // 'f' for Fit
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIdx, selected, scale]);

  // Lock background scroll when lightbox is open
  useEffect(() => {
    if (lightboxIdx !== -1) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev);
    }
  }, [lightboxIdx]);

  function openLightbox(i) { setLightboxIdx(i); }
  function closeLightbox() { setLightboxIdx(-1); }

  function currentImagesForLightbox() {
    if (!selected) return [];
    const typeMap = byType.get(selected.type) ?? new Map();
    const entry = typeMap.get(selected.model);
    const catMap = entry?.categories ?? new Map();
    if (activeCategory === "all") return Array.from(catMap.values()).flat();
    return catMap.get(activeCategory) || [];
  }

  function next() {
    const arr = currentImagesForLightbox();
    if (arr.length === 0) return;
    setLightboxIdx((i) => (i + 1) % arr.length);
  }
  function prev() {
    const arr = currentImagesForLightbox();
    if (arr.length === 0) return;
    setLightboxIdx((i) => (i - 1 + arr.length) % arr.length);
  }

  // ---- Zoom/Pan handlers ----
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function zoomIn()  { setScale((s) => clamp(s * 1.2, MIN_SCALE, MAX_SCALE)); }
  function zoomOut() { setScale((s) => clamp(s / 1.2, MIN_SCALE, MAX_SCALE)); }

  const onWheel = (e) => {
    if (lightboxIdx === -1) return;
    e.preventDefault();
    const delta = -e.deltaY; // up = zoom in
    const factor = Math.exp(delta * 0.0015); // smooth-ish
    setScale((s) => clamp(s * factor, MIN_SCALE, MAX_SCALE));
  };

  const onMouseDown = (e) => {
    if (lightboxIdx === -1) return;
    // Only enable panning when zoomed in past 1
    if (scale <= 1) return;
    e.preventDefault();
    e.stopPropagation(); // don’t close lightbox
    setPanning(true);
    panRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e) => {
    if (!panning) return;
    e.preventDefault();
    const dx = e.clientX - panRef.current.x;
    const dy = e.clientY - panRef.current.y;
    panRef.current = { x: e.clientX, y: e.clientY };
    // translate in screen px (simple, feels natural)
    setTx((t) => t + dx);
    setTy((t) => t + dy);
  };

  const endPan = () => setPanning(false);

  const onDoubleClick = (e) => {
    e.stopPropagation();
    if (scale === 1) {
      setScale(2);
    } else {
      resetZoom();
    }
  };

  const labelize = (s) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ----------------- Model Detail (with category filters) -----------------
  if (selected) {
    const typeMap = byType.get(selected.type) ?? new Map();
    const entry = typeMap.get(selected.model) || { categories: new Map() };
    const catMap = entry.categories;

    const categories = Array.from(catMap.keys())
      .filter((c) => c !== "thumbnail")
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    const images =
      activeCategory === "all"
        ? Array.from(catMap.values()).flat()
        : catMap.get(activeCategory) || [];

    return (
      <div>
        <div className="back-row">
          <button
            onClick={() => {
              setSelected(null);
              setActiveCategory("all");
            }}
          >
            &larr; Back
          </button>
          <h2 className="gallery-title">{selected.model}</h2>
        </div>

        {/* Category pills inside a model */}
        <div className="filter-row" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button
            className={`pill ${activeCategory === "all" ? "pill--active" : ""}`}
            onClick={() => setActiveCategory("all")}
            aria-pressed={activeCategory === "all"}
          >
            All ({Array.from(catMap.values()).reduce((n, arr) => n + arr.length, 0)})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pill ${activeCategory === cat ? "pill--active" : ""}`}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              title={`Show ${cat}`}
            >
              {labelize(cat)} ({(catMap.get(cat) || []).length})
            </button>
          ))}
        </div>

        {/* Image grid */}
        <div className="model-grid">
          {images.map(({ file, url }, i) => (
            <button
              className="model-card model-card--button"
              key={`${activeCategory}-${file}-${i}`}
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

        {/* LIGHTBOX over currently filtered set */}
        {lightboxIdx !== -1 && (
          <div
            className="lightbox"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            // allow wheel-zoom anywhere in the dark area
            onWheel={onWheel}
            onMouseMove={onMouseMove}
            onMouseUp={endPan}
            onMouseLeave={endPan}
          >
            {/* Controls */}
            <button className="lightbox-close" onClick={(e)=>{e.stopPropagation(); closeLightbox();}} aria-label="Close">✕</button>
            <button className="lightbox-nav left" onClick={(e)=>{e.stopPropagation(); prev();}} aria-label="Previous">‹</button>
            <button className="lightbox-nav right" onClick={(e)=>{e.stopPropagation(); next();}} aria-label="Next">›</button>

            {/* Zoom toolbar */}
            <div
              className="lightbox-toolbar"
              style={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 8,
                background: "rgba(0,0,0,.4)",
                border: "1px solid rgba(255,255,255,.2)",
                borderRadius: 8,
                padding: "6px 8px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={zoomOut} aria-label="Zoom out">−</button>
              <button onClick={resetZoom} aria-label="Fit to screen">Fit</button>
              <button onClick={zoomIn} aria-label="Zoom in">+</button>
              <span style={{ color:"#fff", marginLeft: 8 }}>
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Image wrapper to capture pan + double-click */}
            {(() => {
              const arr = currentImagesForLightbox();
              const img = arr[lightboxIdx];
              if (!img) return null;
              return (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={onDoubleClick}
                  onMouseDown={onMouseDown}
                  style={{
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    cursor: scale > 1 ? (panning ? "grabbing" : "grab") : "zoom-in",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <img
                    className="lightbox-img"
                    src={img.url}
                    alt={img.file}
                    draggable={false}
                    style={{
                      transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
                      transition: panning ? "none" : "transform 120ms ease",
                      willChange: "transform",
                      // keep the image from shrinking weirdly
                      maxWidth: "90vw",
                      maxHeight: "90vh",
                      objectFit: "contain",
                      userSelect: "none",
                      pointerEvents: "auto",
                      display: "block",
                    }}
                  />
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // ----------------- Landing: Type filter + Model grid -----------------
  const allTypeList = types; // already sorted
  const labelizeType = (s) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Decide which types we’re showing (All = every type)
  const visibleTypes = selectedType === "all" ? allTypeList : [selectedType];

  // Build a flat list of { type, model, cover } to render cards
  const modelCards = [];
  for (const t of visibleTypes) {
    const typeMap = byType.get(t) ?? new Map();
    const modelList = models.get(t) ?? [];
    for (const model of modelList) {
      const entry = typeMap.get(model);
      // Prefer cover; else first image from first category
      let cover = entry?.cover;
      if (!cover) {
        const firstCat = Array.from(entry?.categories?.keys() ?? []).sort()[0];
        cover = firstCat ? (entry.categories.get(firstCat)?.[0] ?? null) : null;
      }
      if (cover) modelCards.push({ type: t, model, cover });
    }
  }

  return (
    <div>
      {/* Top-level Type filter bar */}
      <div className="filter-row" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 12px" }}>
        <button
          className={`pill ${selectedType === "all" ? "pill--active" : ""}`}
          onClick={() => setSelectedType("all")}
          aria-pressed={selectedType === "all"}
        >
          All Types ({allTypeList.length})
        </button>
        {allTypeList.map((t) => (
          <button
            key={t}
            className={`pill ${selectedType === t ? "pill--active" : ""}`}
            onClick={() => setSelectedType(t)}
            aria-pressed={selectedType === t}
            title={`Show ${t}`}
          >
            {labelizeType(t)} ({(models.get(t) || []).length})
          </button>
        ))}
      </div>

      {/* Model grid (filtered by selectedType) */}
      <div className="model-grid">
        {modelCards.map(({ type, model, cover }) => (
          <button
            className="model-card model-card--button"
            key={`${type}::${model}`}
            onClick={() => {
              setSelected({ type, model });
              setActiveCategory("all");
            }}
            title={`Open ${model}`}
          >
            <div className="thumb-wrap">
              <img src={cover.url} alt={`${model}`} />
            </div>
            <div className="model-name">
              {model} <span style={{ opacity: 0.6 }}>• {labelizeType(type)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
