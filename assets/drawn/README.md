# Hand-Drawn Assets for Drawing Mode

This folder contains all the custom hand-drawn assets that transform your website into a drawn aesthetic.

## Required Assets

### 1. **paper-texture.png**
- **Purpose**: Main background texture for the entire page
- **Dimensions**: 1920x1080 or larger (repeating pattern works best)
- **Style**: Scanned paper, watercolor paper, or textured cardstock
- **Usage**: Applied to `body.drawn-mode` background

### 2. **sketch-overlay.png**
- **Purpose**: Overlay texture to add sketch-like grain
- **Dimensions**: 1920x1080 or larger
- **Style**: Pencil texture, grain, or subtle noise
- **Opacity**: Will be displayed at 15% opacity with multiply blend mode
- **Usage**: Applied as `::before` pseudo-element overlay

### 3. **drawn-desktop-bg.png**
- **Purpose**: Hand-painted desktop background
- **Dimensions**: 1920x1080 or larger
- **Style**: Hand-drawn version of your desktop wallpaper
- **Usage**: Replaces `.desktop-background` when in drawn mode

### 4. **window-paper.png**
- **Purpose**: Paper texture for windows
- **Dimensions**: 900x600 (or larger, will be scaled)
- **Style**: Clean paper texture, slightly different from main background
- **Usage**: Applied to browser windows and finder windows

### 5. **drawn-sky.png**
- **Purpose**: Hand-painted sky for intro screen
- **Dimensions**: 1920x1080 or larger
- **Style**: Hand-painted gradient sky (blue to pink)
- **Usage**: Replaces intro screen gradient background

## Optional Enhancements

### Hand-Drawn Icons
Replace dock icons with hand-drawn versions:
- Add data attributes to dock items
- Use CSS to swap background images
- Example: `[data-icon="finder"].drawn-mode { background-image: url('drawn/finder-icon.png'); }`

### Custom Borders
Create wiggly border images:
- `wiggly-border.png` - Repeating hand-drawn border pattern
- Apply using `border-image` CSS property

### Crayon Textures
Add crayon stroke textures for buttons:
- `crayon-stroke-blue.png`
- `crayon-stroke-red.png`
- `crayon-stroke-yellow.png`

## File Format Recommendations

- **Format**: PNG with transparency preferred
- **Color Mode**: RGB
- **Resolution**: 72-150 DPI
- **File Size**: Optimize for web (< 500KB per image recommended)

## Creating Your Assets

### Tips for Hand-Drawn Look:

1. **Scan Real Drawings**
   - Draw on paper with pencils, markers, or crayons
   - Scan at high resolution (300+ DPI)
   - Clean up in photo editor
   - Export as PNG

2. **Digital Drawing**
   - Use Procreate, Photoshop, or similar
   - Use brush tools with texture
   - Add imperfections and variation
   - Avoid perfectly straight lines

3. **Texture Sources**
   - Real paper scans work best
   - Avoid overly digital textures
   - Add grain and imperfections
   - Keep it whimsical!

## Quick Start

If you don't have custom assets yet, the CSS will gracefully fall back to CSS filters and effects that simulate a hand-drawn look using:
- Thicker borders
- Box shadows with offset
- Font weight adjustments
- Color saturation changes

## Testing

After adding your assets:
1. Clear browser cache
2. Click "Turn Me Into a Drawing" button
3. Check console for any loading errors
4. Adjust image paths if needed

## File Paths

All images should be placed in:
```
/assets/drawn/
```

And referenced in CSS as:
```css
url('../assets/drawn/filename.png')
```
