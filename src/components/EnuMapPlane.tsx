// EnuMapPlane.tsx
import React, { useContext, useEffect, useRef } from "react"
import * as THREE from "three"
import { ThreeContext } from "./ThreeCanvas"

export type ENU3 = { e: number; n: number; u?: number }

type Props = {
  textureUrl: string
  width_m: number
  height_m: number
  mapCenterENU: ENU3
  yaw_deg?: number
  planeZ_m?: number
  originLineDown_m?: number

  /** NEW: scales the plane size (and origin marker size) uniformly. Default 1. */
  scale?: number
}

export default function EnuMapPlane({
  textureUrl,
  width_m,
  height_m,
  mapCenterENU,
  yaw_deg = 0,
  planeZ_m = 0.05,
  originLineDown_m = 60,
  scale = 1,
}: Props) {
  const ctx = useContext(ThreeContext)
  const groupRef = useRef<THREE.Group | null>(null)
  const planeRef = useRef<THREE.Mesh | null>(null)
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const texRef = useRef<THREE.Texture | null>(null)

  useEffect(() => {
    if (!ctx) return
    const { scene } = ctx

    const g = new THREE.Group()
    groupRef.current = g
    scene.add(g)

    // Plane
    const geo = new THREE.PlaneGeometry(width_m, height_m, 1, 1)

    // Always-visible fallback: checkerboard
    const fallbackMap = makeCheckerTexture()
    fallbackMap.needsUpdate = true

    const mat = new THREE.MeshStandardMaterial({
      map: fallbackMap, // fallback first
      color: 0x777777,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
    })
    matRef.current = mat

    const plane = new THREE.Mesh(geo, mat)
    planeRef.current = plane
    g.add(plane)

    // Origin marker (ENU 0,0,0)
    const cross = new THREE.Group()
    const s = Math.min(width_m, height_m) * 0.03

    cross.add(line(new THREE.Vector3(-s, 0, 0), new THREE.Vector3(s, 0, 0), 0xff4d4d))
    cross.add(line(new THREE.Vector3(0, -s, 0), new THREE.Vector3(0, s, 0), 0xff4d4d))
    cross.add(
      line(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -Math.abs(originLineDown_m)),
        0xff4d4d
      )
    )
    cross.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(s * 0.15, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff4d4d })
      )
    )
    g.add(cross)

    // Load texture (replace fallback if success)
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin("anonymous")

    loader.load(
      textureUrl,
      (tex) => {
        texRef.current = tex
        tex.colorSpace = THREE.SRGBColorSpace
        tex.wrapS = THREE.ClampToEdgeWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        mat.map = tex
        mat.needsUpdate = true
        console.log(
          "[EnuMapPlane] texture loaded:",
          textureUrl,
          (tex as any).image?.width,
          (tex as any).image?.height
        )
      },
      undefined,
      (err) => {
        console.warn("[EnuMapPlane] texture FAILED:", textureUrl, err)
      }
    )

    return () => {
      scene.remove(g)
      geo.dispose()
      mat.dispose()
      fallbackMap.dispose()
      texRef.current?.dispose()
      texRef.current = null
      groupRef.current = null
      planeRef.current = null
      matRef.current = null
    }
  }, [ctx, textureUrl, width_m, height_m, originLineDown_m])

  // NEW: apply position/rotation/scale together
  useEffect(() => {
    const plane = planeRef.current
    const g = groupRef.current
    if (!plane || !g) return

    const yawRad = (yaw_deg * Math.PI) / 180

    // Position stays in ENU (so you “scale the map”, not the world coords)
    plane.position.set(mapCenterENU.e, mapCenterENU.n, (mapCenterENU.u ?? 0) + planeZ_m)
    plane.rotation.set(0, 0, yawRad)

    // Scale the entire group so the plane and origin marker scale together
    g.scale.set(scale, scale, scale)
  }, [mapCenterENU.e, mapCenterENU.n, mapCenterENU.u, planeZ_m, yaw_deg, scale])

  return null
}

function line(a: THREE.Vector3, b: THREE.Vector3, color: number) {
  const geom = new THREE.BufferGeometry().setFromPoints([a, b])
  const mat = new THREE.LineBasicMaterial({ color })
  return new THREE.Line(geom, mat)
}

function makeCheckerTexture() {
  const c = document.createElement("canvas")
  c.width = 256
  c.height = 256
  const ctx = c.getContext("2d")!

  const cell = 32
  for (let y = 0; y < c.height; y += cell) {
    for (let x = 0; x < c.width; x += cell) {
      const on = (x / cell + y / cell) % 2 === 0
      ctx.fillStyle = on ? "#1d2633" : "#0f1622"
      ctx.fillRect(x, y, cell, cell)
    }
  }

  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 20px system-ui"
  ctx.fillText("MAP", 110, 130)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}