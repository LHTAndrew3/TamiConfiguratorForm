# TAMI Configurator

Application for configuring TAMI assistive mobility eyewear, developed by **Lighthouse Tech SA**.

The app guides sales staff or end customers through a three-step visual configurator — size, frame colour, and lens type — with a live 3D preview of the glasses. Once satisfied, the user fills in their contact details and the app opens their default email client with the configuration pre-filled and ready to send.

The project ships in three flavours from a single codebase:

- **Desktop app** ([index_exec.html](index_exec.html)) — packaged with Tauri 2 into native installers for Windows (`.exe`) and macOS (`.dmg` / `.app`).
- **Web app** ([index.html](index.html)) — same configurator, deployed as a static site on GitHub Pages and accessible from any browser via a public link.
- **Embedded 3D viewer** ([viewer.html](viewer.html)) — headless variant of the 3D preview only (no UI), designed to be embedded as an iframe inside the Wix Stores TAMI product page. Communicates with the host page via `postMessage` to react in real time to the customer's frame-colour and lens-type selections.

The two entry-point files are identical except for the mailto trigger: the desktop version calls `__TAURI__.invoke('open_url', ...)` (required because the Tauri WebView does not follow `window.location.href` for `mailto:` schemes), while the web version uses a plain `window.location.href = mailto` (handled by the browser, which opens the user's default mail client — Outlook, Gmail, Apple Mail, etc.).

---

## What it does

1. **Step 1 – Size** — choose between Large (55–19–145) and Regular (52–18–140)
2. **Step 2 – Frame colour** — Black, White, Havana, or Burgundy
3. **Step 3 – Lens type** — Neutral, Yellow, Gradient Blue, or Gradient Grey
4. **3D preview** — interactive Three.js viewer (drag to rotate 360°, scroll to zoom) that updates in real time with the selected colour and lens tint
5. **Order form** — name, email, and optional notes; on submit the app opens a pre-filled `mailto:` to `dev@lighthousetech.ch`

---

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri 2](https://tauri.app) (Rust) |
| Frontend | Vanilla HTML / CSS / JavaScript |
| 3D viewer | [Three.js 0.160](https://threejs.org) via CDN import map |
| 3D model | GLTF/GLB exported from Blender (`blender/tami-glasses.gltf`) |
| Build script | Node.js (`sync-frontend.js`) |

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org) | 18+ | includes `npm` |
| [Rust + Cargo](https://rustup.rs) | stable | `rustup update stable` |
| Tauri CLI | 2.x | installed automatically by `npm install` |
| **macOS only** – Xcode CLT | latest | `xcode-select --install` |
| **Windows only** – WebView2 | bundled by installer | ships with Windows 11; auto-installed on older systems |

---

## Development

```bash
# 1. Install dependencies
npm install

# 2. Start the app in dev mode (hot reload)
npm run dev
```

`sync-frontend.js` runs automatically before the dev server starts — it copies `index_exec.html` (renamed to `index.html`), `assets/`, `blender/`, and `images/` into `dist/` so Tauri can serve them. The root-level `index.html` is reserved for the web/GitHub Pages version and is **not** used by the Tauri build.

---

## Building distributable packages

### macOS — `.app` and `.dmg`

Run on a Mac (cross-compilation to macOS is not supported).

#### Quick build (sviluppo locale, senza firma)

```bash
npm run build
```

#### Build firmata e notarizzata (distribuzione)

Usa lo script `build-mac.sh`, che legge le credenziali da `.env.local` ed esegue firma + notarizzazione in automatico.

**1. Crea il file `.env.local`** nella root del progetto (è già nel `.gitignore`, non verrà mai committato):

```bash
APPLE_ID="tua@email.com"
APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"
APPLE_TEAM_ID="XXXXXXXXXX"
```

**2. Ottieni l'App-Specific Password**

`APPLE_PASSWORD` non è la password del tuo Apple ID, ma una password specifica per l'app generata da Apple:

1. Accedi su [appleid.apple.com](https://appleid.apple.com)
2. Nella sezione **Accedi e sicurezza**, clicca su **Password specifiche per le app**
3. Clicca **+** e dai un nome (es. `TAMI Notarize`)
4. Apple genera una password nel formato `xxxx-xxxx-xxxx-xxxx` — copiala nel campo `APPLE_PASSWORD` di `.env.local`

> La password può essere revocata in qualsiasi momento dalla stessa pagina senza influire sull'account.

**3. Lancia il build**

```bash
./build-mac.sh
```

Lo script esporta le variabili d'ambiente, compila l'app, la firma con il certificato **Developer ID Application: Lighthouse Tech SA** e la invia ad Apple per la notarizzazione. Al termine, Gatekeeper non mostrerà più avvisi all'apertura.

Outputs:
```
src-tauri/target/release/bundle/
  macos/   TAMI Configurator.app
  dmg/     TAMI Configurator_1.0.0_aarch64.dmg   # Apple Silicon
            TAMI Configurator_1.0.0_x64.dmg        # Intel
```

Minimum macOS version: **10.15 Catalina**.

---

### Windows — NSIS installer (`.exe`)

Run on Windows (or via a Windows CI runner):

```bash
npm run build
```

Outputs:
```
src-tauri/target/release/bundle/
  nsis/   TAMI Configurator_1.0.0_x64-setup.exe
```

The installer is built with [NSIS](https://nsis.sourceforge.io) and bundles the WebView2 runtime for machines that don't already have it.

---

## Web deployment — GitHub Pages

The web version of the configurator is published as a static site directly from this repository using **GitHub Pages**. Anyone with the link can open the configurator in their browser — no install required.

**Live URL:** [https://lhtandrew3.github.io/TamiConfiguratorForm/](https://lhtandrew3.github.io/TamiConfiguratorForm/)

### How it works

GitHub Pages serves the repository root as a static website:

- `index.html` — the web entry point (browser version of the configurator)
- `assets/`, `blender/`, `images/` — same asset folders used by the Tauri build
- `.nojekyll` — disables Jekyll processing so all files are served as-is

No build step is required for the web version: pushing to `main` is enough — GitHub Pages picks up the changes and republishes the site within 1–2 minutes.

### Enabling GitHub Pages (one-time setup)

1. Go to the repository on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` — Folder: `/ (root)`
3. Click **Save**

After the first deployment, the live URL appears at the top of the same Pages settings panel.

### Updating the live site

Any commit pushed to `main` that modifies `index.html` or the asset folders triggers an automatic redeploy:

```bash
git add index.html assets/ images/ blender/
git commit -m "update web configurator"
git push
```

Wait ~1–2 minutes, then hard-refresh the live URL (`Ctrl+Shift+R` / `Cmd+Shift+R`) to bypass the CDN cache.

### Notes & limitations

- GitHub Pages is **free** for public repositories on any GitHub plan. For private repositories, Pages requires GitHub Pro.
- Soft limits: 1 GB site size, 100 GB bandwidth/month, 10 builds/hour — more than enough for this configurator.
- The web version uses the **exact same 3D model and assets** as the desktop build, so the visual experience is identical.

---

## Embedded 3D viewer — Wix Stores integration

The repository also ships a third entry point, [viewer.html](viewer.html), which is a **headless** version of the 3D preview: only the Three.js canvas, no configurator UI. It is meant to be embedded as an iframe inside the **Wix Stores TAMI product page** so that the customer can rotate the glasses in 3D while picking SIZE / COLOR / Lens with the native Wix product selectors. The frame colour and lens tint update in real time as the customer interacts with the Wix widgets.

**Live URL:** [https://lhtandrew3.github.io/TamiConfiguratorForm/viewer.html](https://lhtandrew3.github.io/TamiConfiguratorForm/viewer.html)

### How it works

The viewer and the Wix page talk to each other via `window.postMessage`. The Wix page hosts Velo code that listens to the Wix Stores product widget; whenever the customer clicks a colour swatch or a lens swatch, Velo forwards the new value to the iframe.

```
┌─ Wix Stores Product Page (TAMI) ─────────────────────────┐
│                                                          │
│  ┌─── iframe (viewer.html) ───┐    SIZE   [▼ Regular]    │
│  │   Three.js 3D model         │    COLOR  ● ● ○ ●        │
│  │   (rotatable / zoomable)    │    Lens   ○ ● ● ○        │
│  └─────────────────────────────┘    Quantity / Order      │
│              ▲                                            │
│              │ postMessage                                │
│              │                                            │
│   ┌─ Velo (page code) ───────────────────────────────┐    │
│   │  $w('#productPage1').onChoiceSelected(...)       │    │
│   │  → maps Wix choice → viewer command              │    │
│   │  → viewer.postMessage({ type, value })           │    │
│   └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Message protocol

**From Wix (parent) → viewer (iframe):**

| Message | Description |
|---|---|
| `{ type: 'setColour', value: 'Black' \| 'White' \| 'Havana' \| 'Burgundy' }` | repaint the frame and arms |
| `{ type: 'setLens',   value: 'Neutral' \| 'Yellow' \| 'Gradient Blue' \| 'Gradient Grey' }` | retint the lenses |
| `{ type: 'resetView' }` | reset the orbit camera to its initial position |

**From viewer (iframe) → Wix (parent):**

| Message | Description |
|---|---|
| `{ type: 'viewerReady' }` | the viewer JS is loaded and listening |
| `{ type: 'modelLoaded' }` | the GLB has been parsed and added to the scene |
| `{ type: 'modelError', error }` | the GLB failed to load |

Commands received before `modelLoaded` are buffered and replayed automatically when the model becomes ready, so the parent never has to wait or poll.

### Wix setup (Velo)

The host page lives inside the Wix Stores template **Store Pages → Product Page** and exposes the `#productPage1` widget. The page code uses the **`onChoiceSelected`** event of the product widget — the only officially supported way to listen to option changes in Product Page V2 — and `getSelectedChoices()` to read the full current state. Because `COLOR` and `Lens` are typed as **`color`** options in Wix Stores, the choice values arrive as hex codes (e.g. `#000000`) rather than human-readable names; the hex → name map is built at runtime from `getProduct().productOptions`, so renaming a colour in the Wix Dashboard does not require a code change.

The viewer is **collapsed automatically** if the visitor opens a product whose name does not contain "TAMI" — the template page is shared across all store products, but the 3D viewer is meaningful only for TAMI.

### Updating the embedded viewer

The viewer is published by the same GitHub Pages deployment as the web app — push to `main`, wait ~1–2 minutes, hard-refresh the Wix preview/live page.

```bash
git add viewer.html
git commit -m "update embedded viewer"
git push
```

---

## Project structure

```
TamiConfiguratorForm/
├── index.html          # web/GitHub Pages entry point (mailto via window.location.href)
├── index_exec.html     # Tauri desktop entry point (mailto via __TAURI__.invoke)
├── viewer.html         # headless 3D viewer embedded into the Wix product page via iframe
├── .nojekyll           # disables Jekyll on GitHub Pages
├── assets/             # company logo, icons
├── images/             # size/view reference photos
├── blender/            # GLTF model of the TAMI glasses
├── dist/               # auto-generated by sync-frontend.js (do not edit)
├── sync-frontend.js    # copies index_exec.html -> dist/index.html and asset folders
├── build-mac.sh        # build firmato + notarizzato per macOS
├── .env.local          # credenziali Apple (gitignored, da creare manualmente)
├── package.json
└── src-tauri/
    ├── tauri.conf.json # app name, window size, bundle targets, firma
    ├── Cargo.toml
    └── capabilities/   # Tauri permission set
```

---

## Replacing the 3D model

Put the new model at `blender/tami-glasses.gltf` (and the companion `.bin` file if any).
The viewer automatically classifies meshes by name:

- names containing `lens / lente / lenti / glass` → lens (semi-transparent, tinted)
- names containing `templetip / tip / punta / earpiece` → temple tips (the rear part that rests on the ears)
- names containing `arm / temple / asta / aste` → temple arms
- everything else → front frame

For correct colour switching, name the mesh groups in your 3D tool accordingly (e.g. `Frame_Front`, `Arms`, `TempleTips`, `Lenses`). The temple-tip hints are checked **before** the arm hints, so a compound named `TempleTips` is correctly classified as tips and not arms.

---

## Customisation

| What | Where |
|---|---|
| Recipient email address | `index.html` **and** `index_exec.html` → `const RECIPIENT_EMAIL` (keep both in sync) |
| Window size / min size | `src-tauri/tauri.conf.json` → `app.windows` |
| App version | `src-tauri/tauri.conf.json` + `package.json` → `version` |
| App icon | replace files in `src-tauri/icons/` (use `tauri icon` to regenerate from a 1024×1024 PNG) |

---

## Publisher

**Lighthouse Tech SA** — `ch.lighthousetech.tami.configurator`

---

## Contact

For technical questions, bug reports, integration requests, or commercial enquiries, please get in touch with our development team:

- **Email:** [dev@lighthousetech.ch](mailto:dev@lighthousetech.ch)
- **Company:** Lighthouse Tech SA
- **Website:** [lighthousetech.ch](https://lighthousetech.ch)

We aim to respond to all enquiries within two business days.

---

## Copyright & License

Copyright © 2026 **Lighthouse Tech SA**. All rights reserved.

This software and its source code, including the TAMI Configurator application, the bundled 3D models, assets, branding, and documentation, are the confidential and proprietary property of Lighthouse Tech SA and are protected by Swiss and international copyright, trademark, and intellectual-property laws.

It is provided to authorized users solely for internal use in connection with Lighthouse Tech products. No part of this software, in source or binary form, may be reproduced, distributed, modified, transmitted, displayed, sold, licensed, sublicensed, reverse-engineered, decompiled, or otherwise exploited — in whole or in part — without the prior express written permission of Lighthouse Tech SA.

**TAMI™** and the Lighthouse Tech logo are trademarks of Lighthouse Tech SA. All other trademarks referenced in this document are the property of their respective owners.

The software is provided *"as is"*, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. In no event shall Lighthouse Tech SA be liable for any direct, indirect, incidental, special, exemplary, or consequential damages arising in any way out of the use of this software.

See [LICENSE](LICENSE) for the full terms.
