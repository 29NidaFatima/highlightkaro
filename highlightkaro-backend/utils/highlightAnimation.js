/**
 * Highlight animation maths.
 * Keep in sync with highlightkaro-frontend/src/utils/highlightAnimation.js
 * so the editor preview matches the exported video.
 */

// Share of the clip spent animating; the rest holds the finished highlight
const REVEAL_PORTION = 0.75;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * @param {string} animation - left-to-right | down-up | rise | glow | underline
 * @param {number} t - 0..1 position in the clip
 * @param {{x:number,y:number,width:number,height:number}} rect
 * @param {number} opacity - base opacity 0..1
 * @returns {{x:number,y:number,width:number,height:number,opacity:number}}
 */
function getHighlightFrame(animation, t, rect, opacity) {
  const p = easeOutCubic(clamp01(t / REVEAL_PORTION));
  const { x, y, width, height } = rect;

  switch (animation) {
    case "down-up": {
      const h = height * p;
      return { x, y: y + height - h, width, height: h, opacity };
    }
    case "rise": {
      const offset = height * 0.6 * (1 - p);
      return { x, y: y + offset, width, height, opacity: opacity * p };
    }
    case "glow": {
      // Two soft pulses over the clip
      const pulse = Math.sin(clamp01(t) * Math.PI * 4) * 0.3 + 0.7;
      return { x, y, width, height, opacity: opacity * pulse };
    }
    case "underline": {
      const lineH = Math.max(3, height * 0.18);
      return { x, y: y + height - lineH, width: width * p, height: lineH, opacity: Math.min(1, opacity * 1.6) };
    }
    case "left-to-right":
    default:
      return { x, y, width: width * p, height, opacity };
  }
}

module.exports = { getHighlightFrame, REVEAL_PORTION };
