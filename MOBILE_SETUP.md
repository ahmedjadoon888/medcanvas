# Set up MedCanvas in ChatGPT

Use a **plugin**, not a separate bot or ordinary chat. The plugin is called **MedCanvas Mobile**. It uses the official **GitHub app** only for publishing to the existing repository.

## One-time setup on ChatGPT web or desktop

1. Open **Plugins** and install/connect **GitHub**.
2. When GitHub asks for repository access, select only `ahmedjadoon888/medcanvas` if that option is available.
3. Start a new ChatGPT conversation.
4. Type `@Plugin Creator` and select **Plugin Creator**.
5. Attach `medcanvas-mobile-plugin.zip` from the `outputs` folder.
6. Paste this message:

   > Create a private plugin named MedCanvas Mobile from the attached package. Keep its medical privacy and accuracy checks. Include the connected GitHub app so it can write only to ahmedjadoon888/medcanvas on the main branch. The workflow must accept an iPhone screenshot or camera image, create structured deterministic infographic data, update published/index.json, and return https://ahmedjadoon888.github.io/medcanvas/. Do not upload the source image. Keep the plugin private.

7. Follow Plugin Creator's prompts, review the requested GitHub access, and finish creating/installing the plugin.
8. Start a **new** chat after installation.

If **Plugin Creator** is missing, your account or workspace has not enabled plugin creation. In that case, use the MedCanvas website directly for now. Do not create a custom GPT unless plugin creation remains unavailable.

## Everyday use on iPhone

1. Open the ChatGPT app and start a new chat.
2. Type `@MedCanvas Mobile` and select it under **Plugins**.
3. Tap **+** and choose a medical reference screenshot or take a camera photo.
4. Send: **Make and publish this infographic.**
5. Review any safety warning or GitHub approval. MedCanvas returns the published gallery link.

Do not upload images containing a patient name, date of birth, MRN, face, barcode, or other identifying information. The plugin publishes structured text and citations—not the screenshot.

## What each name means

- **MedCanvas Mobile**: your private workflow plugin.
- **GitHub**: the official connection the plugin uses to publish.
- **Plugin Creator**: the ChatGPT tool used once to create/install MedCanvas Mobile.
- **Custom GPT / bot**: not needed for the recommended setup.

Official OpenAI instructions: [Plugins](https://learn.chatgpt.com/docs/plugins) and [Build plugins](https://learn.chatgpt.com/docs/build-plugins).
