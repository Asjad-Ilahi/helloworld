# helloworld

A small Urdu birthday website: a letter that opens, music, a growing cherry blossom tree, pink teddy bears and four years of memories.

It is a plain static site (`index.html`, `style.css`, `script.js`, `assets/`) with no build step.

## Run it locally

```bash
python3 -m http.server 8123
```

Then open http://localhost:8123.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import this GitHub repo.
2. Leave **Framework Preset** as **Other**. There is no build command; `vercel.json` already sets this up.
3. Click **Deploy**.

## Change the names

Edit `CONFIG` at the top of `script.js`.

Photos are from [Unsplash](https://unsplash.com).
