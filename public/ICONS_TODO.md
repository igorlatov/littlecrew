# PWA Icons TODO

The `icon.svg` file is a placeholder. For the PWA to work properly on iPad, you need PNG icons.

## Quick way to create icons:

1. Convert icon.svg to PNG:
   ```bash
   # Using ImageMagick (if installed)
   convert -background none -density 1200 icon.svg -resize 192x192 icon-192.png
   convert -background none -density 1200 icon.svg -resize 512x512 icon-512.png
   ```

2. Or use an online converter:
   - Upload icon.svg to https://cloudconvert.com/svg-to-png
   - Export at 192x192 and 512x512
   - Save as icon-192.png and icon-512.png

3. Or create custom icons in Figma/Canva:
   - 192x192px
   - 512x512px
   - Export as PNG
   - Keep it simple and recognizable

The manifest.json is already configured to look for:
- `/icon-192.png`
- `/icon-512.png`

Just add those files and redeploy!
