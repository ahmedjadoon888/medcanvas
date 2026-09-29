# MedCanvas

MedCanvas is a personal public gallery for medical infographics. The website is intentionally read-only: visitors can browse, open, share, and download published visuals, but they cannot upload source images or generate new content.

Creation and publishing happen privately through the **MedCanvas Mobile** ChatGPT plugin. The plugin accepts an iPhone screenshot or camera image, checks privacy and medical claims, converts it to structured JSON, and commits only the finished infographic data to this repository. The source image is never published.

> MedCanvas is for education only and is not medical advice. Automated transcription and summarization can be wrong. Every number, unit, warning, and source must be reviewed before publication.

## How it works

```text
iPhone screenshot or camera photo
        ↓
Private MedCanvas Mobile plugin in ChatGPT
        ↓
Privacy check + transcription + authoritative-source review
        ↓
Structured deterministic JSON
        ↓
GitHub commit to published/<slug>.json + published/index.json
        ↓
Public MedCanvas gallery on GitHub Pages
```

The public site renders all infographic wording as deterministic SVG text. It does not use AI-rendered text and contains no public authoring interface, GitHub token form, OCR upload, analytics, or cookies.

## Repository structure

```text
.
├── index.html
├── styles.css
├── js/
│   ├── gallery.js             # Read-only gallery and downloads
│   └── renderer.js            # Deterministic SVG renderer
├── published/
│   ├── index.json             # Gallery manifest
│   └── <topic-slug>.json      # Published infographic data
└── MOBILE_SETUP.md
```

## Deploy free on GitHub Pages

1. Put these files in the root of a public GitHub repository.
2. Open **Settings → Pages** in that repository.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select `main` and `/(root)`, then save.
5. Wait for the Pages deployment to finish.

For this repository, the gallery is:

<https://ahmedjadoon888.github.io/medcanvas/>

No paid server, database, build step, or GitHub Action is required.

## Publish from iPhone

Follow [MOBILE_SETUP.md](MOBILE_SETUP.md). In daily use:

1. Open a new ChatGPT chat on iPhone.
2. Select `@MedCanvas Mobile`.
3. Attach a screenshot or take a camera photo.
4. Send: **Make and publish this infographic.**
5. Accept the GitHub approval if shown.
6. Trust a success message only when it says **Published and verified** and includes a commit identifier.

The plugin writes only:

- `published/<slug>.json`
- `published/index.json`

It is restricted to `ahmedjadoon888/medcanvas` on `main`. It must not write the source image, OCR dump, access tokens, or patient information.

## Add or repair a post manually

Create a JSON file using the schema in `integrations/plugins/medcanvas-mobile/skills/publish-medical-infographic/references/schema.md`, then prepend its entry to `published/index.json`. The gallery reads that manifest automatically.

Each direct item link uses this form:

```text
https://ahmedjadoon888.github.io/medcanvas/?item=<slug>
```

## Privacy and accuracy

- Never upload or publish patient names, dates of birth, MRNs, faces, barcodes, addresses, or encounter details.
- Never publish a copyrighted source screenshot or page image.
- Preserve numbers, units, inequality signs, qualifications, and negation exactly.
- Verify high-impact claims against current authoritative sources.
- If GitHub returns no successful commit identifier or readback fails, the post is not published.

## License

Project code is available under the MIT License. Medical source material and third-party libraries retain their own rights and licenses.
