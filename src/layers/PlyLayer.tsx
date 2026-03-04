// PlyLayer.tsx
import React, { useContext, useEffect, useRef } from "react"
import * as THREE from "three"
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js"
import PlyBundle from "../components/PlyBundle"
import { ThreeContext } from "../components/ThreeCanvas"

type Props = {
  plyUrl: string

  // optional visual scaling (usually keep 1 for ENU meters)
  scale?: number

  // "points" is safest / fastest
  mode?: "points" | "mesh"

  // points settings
  pointSize?: number // pixels
  maxPoints?: number // downsample cap (simple stride)

  // z lift to avoid z-fighting if needed
  liftU?: number

  // NEW: shift in ENU meters (applied after scale)
  shift?: { e?: number; n?: number; u?: number }

  // NEW: slant/rotate the whole cloud (degrees). Applied about origin (0,0,0).
  // yaw = about Z, pitch = about X, roll = about Y (Three.js default axes)
  slantDeg?: { yaw?: number; pitch?: number; roll?: number }
}

export default function PlyLayer({
  plyUrl,
  scale = 1,
  mode = "points",
  pointSize = 2,
  maxPoints = 400_000,
  liftU = 0,
  shift = {},
  slantDeg = {},
}: Props) {
  const ctx = useContext(ThreeContext)
  const rootRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    if (!ctx) return
    const { scene } = ctx

    const root = new THREE.Group()
    rootRef.current = root
    scene.add(root)

    let disposed = false

    const loader = new PLYLoader()
    loader.load(
      plyUrl,
      (geom) => {
        if (disposed) return

        const pos = geom.getAttribute("position")
        if (!pos) {
          console.error("[PlyLayer] PLY has no position attribute:", plyUrl)
          return
        }

        const dsGeom = downsampleGeometry(geom, maxPoints)

        // Apply scale + lift + shift + slant by modifying vertex positions (keeps ENU-consistent)
        applyTransform(dsGeom, {
          scale,
          liftU,
          shift,
          slantDeg,
        })

        if (mode === "mesh" && !dsGeom.getAttribute("normal")) {
          dsGeom.computeVertexNormals()
        }

        const hasColor = !!dsGeom.getAttribute("color")

        if (mode === "mesh" && dsGeom.index) {
          const mat = new THREE.MeshStandardMaterial({
            vertexColors: hasColor,
            roughness: 1,
            metalness: 0,
            side: THREE.DoubleSide,
          })
          const mesh = new THREE.Mesh(dsGeom, mat)
          root.add(mesh)
        } else {
          const mat = new THREE.PointsMaterial({
            size: pointSize,
            sizeAttenuation: false,
            vertexColors: hasColor,
            color: hasColor ? 0xffffff : 0xd0d0d0,
          })
          const pts = new THREE.Points(dsGeom, mat)
          root.add(pts)
        }

        console.log("[PlyLayer] loaded:", plyUrl, "verts:", dsGeom.getAttribute("position")!.count)
      },
      undefined,
      (err) => {
        console.error("[PlyLayer] FAILED:", plyUrl, err)
      }
    )

    return () => {
      disposed = true
      scene.remove(root)
      root.traverse((obj) => {
        const anyObj = obj as any
        if (anyObj.geometry) anyObj.geometry.dispose()
        if (anyObj.material) {
          if (Array.isArray(anyObj.material)) anyObj.material.forEach((m: any) => m.dispose())
          else anyObj.material.dispose()
        }
      })
      rootRef.current = null
    }
  }, [
    ctx,
    plyUrl,
    scale,
    mode,
    pointSize,
    maxPoints,
    liftU,
    shift?.e,
    shift?.n,
    shift?.u,
    slantDeg?.yaw,
    slantDeg?.pitch,
    slantDeg?.roll,
  ])

  return null
}

// ---------------- helpers ----------------

function downsampleGeometry(src: THREE.BufferGeometry, maxPoints: number) {
  const pos = src.getAttribute("position") as THREE.BufferAttribute
  const n = pos.count
  if (n <= maxPoints) return src

  const stride = Math.ceil(n / maxPoints)
  const dst = new THREE.BufferGeometry()

  const attrsToCopy = ["position", "normal", "color"]
  for (const name of attrsToCopy) {
    const a = src.getAttribute(name) as THREE.BufferAttribute | undefined
    if (!a) continue
    const itemSize = a.itemSize
    const out = new Float32Array(Math.ceil(n / stride) * itemSize)
    let j = 0
    for (let i = 0; i < n; i += stride) {
      const base = i * itemSize
      const outBase = j * itemSize
      for (let k = 0; k < itemSize; k++) out[outBase + k] = (a.array as any)[base + k] as number
      j++
    }
    dst.setAttribute(name, new THREE.BufferAttribute(out, itemSize))
  }

  dst.computeBoundingSphere()
  return dst
}

function applyTransform(
  geom: THREE.BufferGeometry,
  opts: {
    scale: number
    liftU: number
    shift?: { e?: number; n?: number; u?: number }
    slantDeg?: { yaw?: number; pitch?: number; roll?: number }
  }
) {
  const pos = geom.getAttribute("position") as THREE.BufferAttribute

  const s = opts.scale ?? 1
  const liftU = opts.liftU ?? 0
  const shE = opts.shift?.e ?? 0
  const shN = opts.shift?.n ?? 0
  const shU = (opts.shift?.u ?? 0) + liftU

  const yaw = degToRad(opts.slantDeg?.yaw ?? 0) // Z
  const pitch = degToRad(opts.slantDeg?.pitch ?? 0) // X
  const roll = degToRad(opts.slantDeg?.roll ?? 0) // Y

  // Rotation matrix (Yaw * Pitch * Roll) using Three's Euler default order "XYZ"
  // We want: rotate around X (pitch), then Y (roll), then Z (yaw) -> "XYZ"
  const euler = new THREE.Euler(pitch, roll, yaw, "XYZ")
  const rot = new THREE.Matrix4().makeRotationFromEuler(euler)
  const v = new THREE.Vector3()

  for (let i = 0; i < pos.count; i++) {
    // scale first
    v.set(pos.getX(i) * s, pos.getY(i) * s, pos.getZ(i) * s)

    // slant (rotate about origin)
    v.applyMatrix4(rot)

    // shift after rotation
    v.x += shE
    v.y += shN
    v.z += shU

    pos.setXYZ(i, v.x, v.y, v.z)
  }

  pos.needsUpdate = true
  geom.computeBoundingSphere()
}

function degToRad(d: number) {
  return (d * Math.PI) / 180
}