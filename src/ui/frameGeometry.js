export const SCENE_WIDTH = 640
export const SCENE_HEIGHT = 520

// A narrow screen crops around the timeline center, keeping one SVG unit per px.
export function sceneX(x, displayWidth, sceneWidth = SCENE_WIDTH) {
  return x + (sceneWidth - displayWidth) / 2
}

export function phoneContentHeight(rowCount) {
  return Math.max(SCENE_HEIGHT, 81 + rowCount * 40 + 8 + 110)
}
