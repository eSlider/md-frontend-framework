# Idea

[← yamd manual](docs/index.md) · [Philosophy](#docs/philosophy) · [Architecture](#docs/architecture)

Content delivery hands the browser a **string**; `compile` turns it into `{ meta, parts }`; the renderer only consumes that object. This keeps the transport (HTTP, `file`, CMS) separate from the view.
