import * as THREE from "three"

export function makeLabelSprite(text: string) {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  const pad = 20
  const fontSize = 48
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`

  const metrics = ctx.measureText(text)
  const w = Math.ceil(metrics.width + pad * 2)
  const h = Math.ceil(fontSize + pad * 2)

  canvas.width = w
  canvas.height = h

  const ctx2 = canvas.getContext("2d")!
  ctx2.font = `bold ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`
  ctx2.fillStyle = "rgba(0,0,0,0.65)"
  ctx2.strokeStyle = "rgba(255,255,255,0.9)"
  ctx2.lineWidth = 6

  const r = 18
  const x = 0
  const y = 0

  ctx2.beginPath()
  ctx2.moveTo(x + r, y)
  ctx2.lineTo(x + w - r, y)
  ctx2.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx2.lineTo(x + w, y + h - r)
  ctx2.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx2.lineTo(x + r, y + h)
  ctx2.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx2.lineTo(x, y + r)
  ctx2.quadraticCurveTo(x, y, x + r, y)
  ctx2.closePath()
  ctx2.fill()
  ctx2.stroke()

  ctx2.fillStyle = "white"
  ctx2.textBaseline = "middle"
  ctx2.fillText(text, pad, h / 2)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter

  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true })
  const sprite = new THREE.Sprite(mat)

  const worldH = 40
  const aspect = w / h
  sprite.scale.set(worldH * aspect, worldH, 1)

  return sprite
}

export function disposeLabelSprite(sprite: THREE.Sprite) {
  const mat = sprite.material as THREE.SpriteMaterial
  mat.map?.dispose()
  mat.dispose()
}