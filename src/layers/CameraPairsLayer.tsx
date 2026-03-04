// CameraPairsLayer.tsx
import React, { useContext, useEffect, useRef } from "react"
import * as THREE from "three"
import { ThreeContext } from "../components/ThreeCanvas"

type ENU = { e: number; n: number; u: number }
type Payload = {
  gps: Array<{ img: string; enu: ENU }>
  colmap: Array<{ img: string; enu: ENU }>
  pairs: Array<{ img: string; gps_enu: ENU; colmap_enu: ENU }>
}

type Props = {
  jsonUrl: string
  scale?: number
  maxPairs?: number

  // sphere radii in ENU meters (before scale)
  gpsRadius?: number
  colmapRadius?: number

  // lift all points/line endpoints upward in ENU meters
  liftU?: number
}

export default function CameraPairsLayer({
  jsonUrl,
  scale = 1,
  maxPairs = 10_000,
  gpsRadius = 1.2,
  colmapRadius = 1.2,
  liftU = 20,
}: Props) {
  const ctx = useContext(ThreeContext)
  const rootRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    if (!ctx) return
    const { scene } = ctx

    const root = new THREE.Group()
    rootRef.current = root
    scene.add(root)

    // lights for real 3D spheres
    const dir = new THREE.DirectionalLight(0xffffff, 1.0)
    dir.position.set(100, 100, 200)
    root.add(dir)

    const amb = new THREE.AmbientLight(0xffffff, 0.45)
    root.add(amb)

    let disposed = false

    ;(async () => {
      const payload: Payload = await fetch(jsonUrl).then((r) => r.json())
      if (disposed) return

      // ---- GPS spheres
      const gpsPts = makeSphereInstances(
        payload.gps.map((p) => p.enu),
        scale,
        gpsRadius,
        0x33ddff,
        liftU
      )
      gpsPts.name = "gps_spheres"
      root.add(gpsPts)

      // ---- COLMAP spheres
      const colPts = makeSphereInstances(
        payload.colmap.map((p) => p.enu),
        scale,
        colmapRadius,
        0xffcc33,
        liftU
      )
      colPts.name = "colmap_spheres"
      root.add(colPts)

      // ---- lines: GPS -> COLMAP for matched pairs
      const pairs = payload.pairs.slice(0, maxPairs)
      const lineGeom = makePairLinesGeometry(pairs, scale, liftU)
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xff4d4d,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
      const lines = new THREE.LineSegments(lineGeom, lineMat)
      lines.name = "pair_lines"
      root.add(lines)
    })().catch((e) => console.error("[CameraPairsLayer] load failed", e))

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
  }, [ctx, jsonUrl, scale, maxPairs, gpsRadius, colmapRadius, liftU])

  return null
}

function makePairLinesGeometry(
  pairs: Array<{ gps_enu: ENU; colmap_enu: ENU }>,
  scale: number,
  liftU: number
) {
  const arr = new Float32Array(pairs.length * 2 * 3)
  let k = 0

  for (const p of pairs) {
    arr[k++] = p.gps_enu.e * scale
    arr[k++] = p.gps_enu.n * scale
    arr[k++] = (p.gps_enu.u + liftU) * scale

    arr[k++] = p.colmap_enu.e * scale
    arr[k++] = p.colmap_enu.n * scale
    arr[k++] = (p.colmap_enu.u + liftU) * scale
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute("position", new THREE.BufferAttribute(arr, 3))
  geom.computeBoundingSphere()
  return geom
}

function makeSphereInstances(
  pts: ENU[],
  scale: number,
  radius: number,
  color: number,
  liftU: number
) {
  const geometry = new THREE.SphereGeometry(radius * scale, 16, 16)

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.1,
  })

  const mesh = new THREE.InstancedMesh(geometry, material, pts.length)

  const dummy = new THREE.Object3D()
  for (let i = 0; i < pts.length; i++) {
    dummy.position.set(
      pts[i].e * scale,
      pts[i].n * scale,
      (pts[i].u + liftU) * scale
    )
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  return mesh
}