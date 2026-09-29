# iPhone → ChatGPT → MedCanvas

This extension lets the everyday workflow start in the ChatGPT iPhone app:

```text
Pocket Medicine screenshot / camera photo
                    ↓
         ChatGPT image understanding
                    ↓
     source-faithful structured JSON
                    ↓
       connected GitHub write action
                    ↓
      GitHub Pages renders SVG + PNG
```

The source image is never committed. Only the structured text, source links, and review metadata are published.

## Recommended: MedCanvas plugin + GitHub plugin

This route requires no application server and no OpenAI API billing. Plugins can be used in ChatGPT on mobile when they are available to the account; creation/import is completed on the web.

1. Deploy the MedCanvas website to a GitHub repository and enable GitHub Pages as described in `README.md`.
2. Edit `integrations/plugins/medcanvas-mobile/skills/publish-medical-infographic/references/repository.md` and replace `OWNER/REPOSITORY` and the Pages URL.
3. Re-create `medcanvas-mobile-plugin.zip` from the contents of `integrations/plugins/medcanvas-mobile/`.
4. In ChatGPT on the web, install and connect the official GitHub plugin. Grant it access only to the MedCanvas repository where possible.
5. Import the private MedCanvas plugin ZIP from the Plugins area if your account/workspace offers private plugin upload. Keep it private while testing.
6. Start a new ChatGPT conversation with MedCanvas Mobile and make sure the GitHub connection is available.
7. On iPhone, open that plugin/chat, tap **+**, and add a screenshot or photo. Say: **“Make and publish this infographic.”**
8. ChatGPT extracts and checks the text, writes `published/<topic>.json`, updates `published/index.json`, and returns the public Pages link. The GitHub connection may show a write-approval prompt.

If ChatGPT reports that no GitHub write tool is available, open **Plugins** on the web, install/connect GitHub, and start a new chat. Plugin availability depends on plan, workspace policy, region, and rollout.

## Legacy fallback: existing Custom GPT or eligible managed workspace

Use this only if the account can still edit an existing Custom GPT or the workspace permits GPT creation and Actions.

1. Open the GPT editor on the web. Mobile supports using GPTs, not building them.
2. Paste `integrations/legacy-gpt-action/instructions.md` into the GPT instructions, replacing `OWNER` and `REPOSITORY`.
3. Add a new Action and import `integrations/legacy-gpt-action/openapi.yaml`.
4. Configure Action authentication as a Bearer API key. Use a fine-grained GitHub token restricted to the MedCanvas repository with **Contents: Read and write**, and give it a short expiration.
5. Restrict the action domain to `api.github.com`, test it in Preview, and keep the GPT private.
6. Open the GPT in the iPhone app, attach the screenshot/photo, and say **“Make and publish this infographic.”**

The Action talks directly to GitHub; there is no paid server. Never paste the GitHub token into a conversation or store it in the repository.

## Safety behavior

- Any possible patient identifier stops the publish flow until the image is cropped or redacted.
- Critical unreadable numbers, units, drug names, or negations stop automatic publishing.
- The plugin should check high-impact claims against authoritative sources when web search is available.
- Public publishing may still require a single ChatGPT/GitHub approval. This is intentional because it is an external write containing medical information.
- The output remains educational and is not medical advice or a substitute for local clinical guidance.
