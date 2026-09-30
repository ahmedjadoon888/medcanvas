# Illustrated MedCanvas posts

MedCanvas supports legacy version-1 cards and version-2 illustrated algorithms.
For version 2, the gallery displays the exact approved artwork at its original
aspect ratio. It does not reconstruct that artwork as cards. Multi-page posts
show every image in the reader, with full-size links and individual downloads.

## Approval and privacy

Create and check the visual privately in ChatGPT. Show every page, obtain explicit
approval for the current revision, and only then upload the generated artwork.
Never upload the source reference screenshot, crops, source-image bytes, raw OCR,
or patient information. Requested changes invalidate approval. Scientific review
must check clinical wording and all decision branches as well as visual quality.

## Version-2 topic record

```json
{
  "version": 2,
  "kind": "illustrated-algorithm",
  "slug": "topic-slug",
  "title": "Topic title",
  "subtitle": "Scope of the algorithm",
  "theme": "sage",
  "updated": "2026-09-30",
  "artwork": [
    {
      "src": "published/assets/topic-slug-<first-12-sha256>.png",
      "mimeType": "image/png",
      "width": 1536,
      "height": 2048,
      "sha256": "<full-64-character-sha256-of-approved-image-bytes>",
      "alt": "Concise accessible description of the algorithm"
    }
  ],
  "sources": [{"label": "Verified source title", "url": "https://example.org/source"}],
  "review": {"revision": "draft-1", "approvedAt": "2026-09-30T00:00:00Z", "verifiedAt": "2026-09-30", "uncertainties": []},
  "note": "For education only. Verify local guidance."
}
```

The placeholders above must be replaced with real values. JPEG uses `.jpg`, PNG
uses `.png`, and WebP uses `.webp`. No SVG, HTML, remote URLs, data URLs, or source
images are accepted as version-2 artwork. Use 1–12 unique images, up to 8192 pixels
per dimension and 5 MiB each. Asset filenames use the post slug and the first
12 characters of the exact approved file's SHA-256. Do not overwrite a hashed
asset with different bytes. Strip private metadata before review/approval, not
after approval. Keep provenance and exact reviewed wording privately available.

The index remains an array with `slug`, `title`, `subtitle`, `theme`, `updated`,
and `data: published/<slug>.json`. Retain unrelated entries. The plugin keeps the
newest 24 entries. The repository publisher may write only the topic record,
index, and generated assets named in that record, all on `main`.

Prefer an atomic Git Data commit using the current main commit and base tree.
Create binary blobs with base64 encoding, add the JSON and asset paths to a tree,
create a commit, and advance main without force. A created commit without a
successful main-ref update is not a successful publication. On conflict, reread
main and reconcile. Verify both JSON files using fresh reads from main and verify
every referenced asset's Git blob SHA against the approved bytes before reporting
success. The gallery also checks SHA-256 before downloading an original image.

If image bytes or upload capability are unavailable, keep the draft unpublished.
Never substitute an expiring/private chat image URL. A private plugin does not
make approved artwork private once it is committed to this public repository.
