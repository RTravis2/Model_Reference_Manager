// src/ModelGrid.jsx
// Shows the first image (alphabetically) from each folder under src/references/*

/**
 * Vite feature: import.meta.glob() finds files at build time and returns URLs.
 * We grab all jpg/jpeg/png files under ./references/** and pick the first file
 * from each subfolder (e.g., "model 1", "model 2", ...).
 */
const files = import.meta.glob("./references/**/*.{jpg,jpeg,png}", {
  eager: true,
  import: "default",
});

function pickFirstPerFolder(all) {
  // Map<folderName, { file: string, url: string }>
  const byFolder = new Map();

  Object.entries(all).forEach(([path, url]) => {
    // path example: "./references/model 1/MaleCast1_Pose1.jpg"
    const parts = path.split("/");
    const file = parts.pop();              // "MaleCast1_Pose1.jpg"
    const folder = parts.pop();            // "model 1"  (folder with space is fine)

    const current = byFolder.get(folder);
    // Keep the alphabetically FIRST file in the folder (Pose1, etc.)
    if (
      !current ||
      file.localeCompare(current.file, undefined, { numeric: true, sensitivity: "base" }) < 0
    ) {
      byFolder.set(folder, { file, url });
    }
  });

  // Sort folders nicely (numeric-aware so "model 10" comes after "model 9")
  const models = Array.from(byFolder.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  return models.map(([folder, { url }]) => ({ folder, url }));
}

const cards = pickFirstPerFolder(files);

export default function ModelGrid() {
  return (
    <div className="model-grid">
      {cards.map(({ folder, url }) => (
        <div className="model-card" key={folder}>
          <div className="thumb-wrap">
            <img src={url} alt={folder} />
          </div>
          <div className="model-name">{folder}</div>
        </div>
      ))}
    </div>
  );
}
