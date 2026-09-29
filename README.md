# MedCanvas

MedCanvas is a free, static medical-infographic studio designed for GitHub Pages. It converts a screenshot or pasted clinical text into editable structured data, renders the final wording as deterministic SVG text, exports PNG/SVG/JSON, and can publish approved visuals back to a GitHub repository.

No application server, database, subscription, or build step is required.

> **Important:** MedCanvas is a communication and design tool—not a clinical validation service. OCR and automated structuring can be wrong. A qualified human must verify every claim, dose, number, unit, link, and local guideline before publishing or using an output.

## What is included

- A polished responsive gallery and browser-based studio
- PNG/JPG/WebP screenshot input
- Local OCR with Tesseract.js (the screenshot is processed in the browser)
- A local heuristic source-to-structure adapter
- Editable title, subtitle, clinical sections, bullets, sources, palette, and layout
- Deterministic SVG text rendering at 1080 × 1350 (4:5)
- SVG, PNG, and structured JSON downloads
- Optional GitHub repository publisher
- A repository-backed gallery using `published/index.json`
- An iPhone-first ChatGPT plugin workflow that publishes through the connected GitHub app
- A direct GitHub Action schema for eligible existing Custom GPTs
- A clinically sourced vitamin B12 deficiency sample
- Review and privacy gates before GitHub publishing

## Try it locally

Opening `index.html` directly will display most of the interface, but browsers restrict some file and download behavior on `file://` pages. Run a tiny static server instead:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

No package installation is necessary. Internet access is needed on first load for the Google fonts and the Tesseract.js OCR library. Pasting text, editing, rendering, and export otherwise happen in the browser.

## Use it from the ChatGPT iPhone app

See [`MOBILE_SETUP.md`](MOBILE_SETUP.md) for the complete setup. The recommended flow uses the bundled private MedCanvas plugin plus ChatGPT's connected GitHub app:

```text
iPhone screenshot/photo → ChatGPT extraction and source checks
                        → structured JSON committed through GitHub
                        → GitHub Pages renders the infographic
```

There is no paid server and no separate OpenAI API call. The source image is not committed. The repository receives only structured infographic data, references, and review metadata. A public-write approval may still appear in ChatGPT; this is intentional.

## Deploy free on GitHub Pages

1. Create a new public GitHub repository, for example `medcanvas`.
2. Upload every file and folder from this project to the root of the repository, or push them with Git.
3. On GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/(root)` folder, then click **Save**.
6. Wait for the green Pages deployment. The site will be available at:

   `https://YOUR-USERNAME.github.io/medcanvas/`

No GitHub Action is needed because the repository already contains deployable static files. GitHub documents this branch-based flow in [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

If the repository is named `YOUR-USERNAME.github.io`, the site URL is instead `https://YOUR-USERNAME.github.io/`.

## Use the studio

1. Upload a clear screenshot or paste its text.
2. Select **Extract & structure**. OCR runs locally when an image is present.
3. Review the title, subtitle, sections, bullets, and sources. The parser organizes text; it does not establish medical truth.
4. Choose a layout and palette while watching the live preview.
5. Open the review step and correct every clinical claim against an authoritative source.
6. Confirm the accuracy and privacy statements.
7. Download PNG/SVG/JSON or publish to the repository.

For best OCR results, use a tightly cropped, upright screenshot with high contrast and at least 1200 pixels on its longest edge. Medical reference material may be copyrighted: process only material you are authorized to use, do not publish the source screenshot, and ensure the infographic is an original, appropriately attributed transformation.

## Configure safe GitHub publishing

The publisher uses GitHub's Contents API directly from the browser. It commits three files:

- `published/TOPIC-SLUG.svg`
- `published/TOPIC-SLUG.json`
- `published/index.json`

The last file drives the “Published from this repository” gallery. GitHub Pages normally refreshes shortly after the commit.

The mobile plugin writes only the topic JSON and gallery index. The website renders its SVG deterministically in the browser, so ChatGPT never has to draw or typeset the medical text.

### Create a least-privilege token

1. On GitHub, open **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Select **Generate new token**.
3. Give it a short expiration.
4. Under **Repository access**, select **Only select repositories**, then choose the MedCanvas repository.
5. Under **Repository permissions**, grant only **Contents: Read and write**.
6. Create the token and copy it once.
7. In MedCanvas, open the review step, complete both checkboxes, and select **Publish to GitHub Pages**.
8. Enter the repository owner, repository name, branch, slug, and token.

The token is held only in the dialog field for that publish request. It is not written to `localStorage`, cookies, the infographic, or the repository, and is cleared when the dialog closes. Never put a token in this repository, a JSON file, or application source code. Revoke it immediately if it is exposed.

For repeated or multi-user publishing, do not distribute a shared personal token. Add a serverless OAuth/GitHub App authorization layer, or let contributors submit pull requests instead.

## Accuracy model and limitations

- OCR can omit punctuation, confuse units, and misread decimal points.
- The local adapter uses headings and line breaks; it is not a medical reasoning system.
- The renderer preserves the text it receives, but preservation does not make that text correct.
- The patient-identifier check only catches a few obvious labels and cannot establish de-identification.
- Source URLs are user-entered and are not automatically checked.
- Published content is public when the GitHub repository/Pages site is public.
- Do not upload or publish protected health information (PHI).

The included B12 sample is based on:

- [NIH Office of Dietary Supplements — Vitamin B12 Fact Sheet for Health Professionals](https://ods.od.nih.gov/factsheets/Vitaminb12-HealthProfessional/)
- [MSD Manual Professional — Vitamin B12 Deficiency](https://www.msdmanuals.com/professional/nutritional-disorders/vitamin-deficiency-dependency-and-toxicity/vitamin-b12-deficiency)

Clinical thresholds and recommendations vary by laboratory, population, and guideline. The sample is educational and must not be treated as patient-specific guidance.

## Add a ChatGPT or plugin adapter later

The conversion layer follows one small contract:

```js
const adapter = {
  id: "my-adapter-v1",
  async transform(sourceText) {
    return infographicData;
  }
};
```

The returned object has this shape:

```json
{
  "version": 1,
  "title": "Topic",
  "subtitle": "Short clinical framing",
  "layout": "clinical-grid",
  "theme": "sage",
  "updated": "September 2026",
  "sections": [
    {
      "heading": "Recognition",
      "icon": "clinical",
      "accent": "coral",
      "items": ["Concise point", "Another point"]
    }
  ],
  "callout": "Critical caveat",
  "sources": [{ "label": "Authoritative source", "url": "https://example.org" }],
  "note": "For education only · Not medical advice"
}
```

Implement a second adapter beside `js/adapters/local-heuristic.js`, load it in `index.html`, and choose it in `js/app.js`. Keep API keys off a public static site. A production ChatGPT/plugin adapter should use OAuth or a narrow serverless relay, validate the returned schema, attach source provenance to individual claims, and preserve the review gate.

## Project structure

```text
.
├── index.html                 # App and gallery markup
├── styles.css                 # Responsive visual system
├── js/
│   ├── app.js                 # Studio state and interactions
│   ├── data.js                # Sourced B12 sample
│   ├── github.js              # Contents API publisher
│   ├── renderer.js            # Deterministic SVG renderer
│   └── adapters/
│       └── local-heuristic.js # Replaceable conversion adapter
├── published/
│   └── index.json             # Public gallery manifest
├── integrations/
│   ├── plugins/
│   │   └── medcanvas-mobile/  # Portable private ChatGPT plugin
│   └── legacy-gpt-action/     # Existing-GPT Action schema and instructions
├── MOBILE_SETUP.md            # iPhone and ChatGPT setup
├── .nojekyll                  # Serve assets without Jekyll processing
└── README.md
```

## Privacy

The app contains no analytics, cookies, or tracking scripts. Uploaded images are passed from the browser to Tesseract.js in memory and are not intentionally sent to an application backend. Tesseract.js itself is loaded from jsDelivr; if an institution requires fully offline use, vendor the library and worker assets into the repository after reviewing their license and pin all paths locally.

## License

Project code is available under the MIT License. Medical source material and third-party libraries retain their own copyrights and licenses.
