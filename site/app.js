const body = document.body;
const base = body.dataset.base ?? "./";

const explainers = await fetch(`${base}explainers.json`).then((response) => {
  if (!response.ok) throw new Error(`Could not load explainers (${response.status})`);
  return response.json();
});

if (body.dataset.page === "gallery") {
  renderGallery(explainers);
} else if (body.dataset.page === "detail") {
  await renderDetail(explainers);
}

function renderGallery(items) {
  const grid = document.querySelector("#gallery-grid");
  grid.innerHTML = items
    .map(
      (item, index) => `
        <a class="explainer-card" href="./explainers/${item.slug}/" style="--accent:${item.accent};--wash:${item.wash};--delay:${index * 45}ms">
          <div class="card-topline">
            <span class="card-number">${item.number}</span>
            <span class="card-arrow" aria-hidden="true">↗</span>
          </div>
          <h3>${item.name}</h3>
          <dl>
            <div><dt>What</dt><dd>${item.what}</dd></div>
            <div><dt>When</dt><dd>${item.when}</dd></div>
            <div><dt>Example</dt><dd>${item.example}</dd></div>
          </dl>
        </a>`,
    )
    .join("");
}

async function renderDetail(items) {
  const item = items.find((candidate) => candidate.slug === body.dataset.slug);
  if (!item) {
    document.querySelector("#detail-intro").innerHTML = "<h1>Explainer not found.</h1>";
    return;
  }

  document.title = `${item.name} — viz-explain`;
  document.documentElement.style.setProperty("--detail-accent", item.accent);
  document.documentElement.style.setProperty("--detail-wash", item.wash);
  document.querySelector("#detail-intro").innerHTML = `
    <div class="detail-title-row">
      <span class="detail-number">${item.number}</span>
      <h1>${item.name}</h1>
    </div>
    <div class="detail-facts">
      <article><p class="fact-label">What this is</p><p>${item.what}</p></article>
      <article><p class="fact-label">When to use it</p><p>${item.when}</p></article>
      <article><p class="fact-label">OpenClaw example</p><p>${item.example}</p></article>
    </div>`;

  const sceneUrl = `${base}scenes/${item.slug}.excalidraw`;
  const scene = await fetch(sceneUrl).then((response) => {
    if (!response.ok) throw new Error(`Could not load scene (${response.status})`);
    return response.json();
  });

  const [{ default: React }, { createRoot }, excalidrawModule] = await Promise.all([
    import("https://esm.sh/react@19.0.0"),
    import("https://esm.sh/react-dom@19.0.0/client?deps=react@19.0.0"),
    import("https://esm.sh/@excalidraw/excalidraw@0.18.0?deps=react@19.0.0,react-dom@19.0.0"),
  ]);

  const { Excalidraw } = excalidrawModule;
  const root = createRoot(document.querySelector("#excalidraw-root"));
  let renderKey = 0;
  let latestScene;
  const status = document.querySelector("#edit-status");

  const renderScene = () => {
    renderKey += 1;
    root.render(
      React.createElement(Excalidraw, {
        key: renderKey,
        initialData: {
          elements: structuredClone(scene.elements),
          appState: {
            ...scene.appState,
            theme: "light",
            viewBackgroundColor: scene.appState?.viewBackgroundColor ?? "#fffdf8",
          },
          files: scene.files ?? {},
          scrollToContent: true,
        },
        onChange: (elements, appState, files) => {
          latestScene = {
            type: "excalidraw",
            version: 2,
            source: window.location.href,
            elements: structuredClone(elements),
            appState: {
              gridSize: appState.gridSize ?? null,
              viewBackgroundColor: appState.viewBackgroundColor ?? "#fffdf8",
            },
            files: structuredClone(files),
          };
        },
        UIOptions: {
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
          },
        },
      }),
    );
  };

  document.querySelector("#excalidraw-root").addEventListener(
    "pointerdown",
    () => {
      status.innerHTML = '<span class="status-dot active"></span> Editing locally';
    },
    { once: true },
  );
  document.querySelector("#reset-canvas").addEventListener("click", () => {
    renderScene();
    status.innerHTML = '<span class="status-dot"></span> Editable canvas';
  });
  document.querySelector("#copy-canvas").addEventListener("click", async (event) => {
    if (!latestScene) return;
    const prompt = [
      "I corrected the viz-explain Excalidraw scene below.",
      "Treat my edits as feedback to investigate, then update the explanation and its canonical scene.",
      "",
      JSON.stringify(latestScene),
    ].join("\n");
    await navigator.clipboard.writeText(prompt);
    event.currentTarget.textContent = "Copied!";
    status.innerHTML = '<span class="status-dot active"></span> Edit copied for agent';
    window.setTimeout(() => {
      event.currentTarget.textContent = "Copy edit for agent";
    }, 1800);
  });
  renderScene();
}
