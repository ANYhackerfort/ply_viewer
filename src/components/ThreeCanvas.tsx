import React, { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export type ThreeCtx = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
}

export const ThreeContext = React.createContext<ThreeCtx | null>(null)

type Props = {
  className?: string
  style?: React.CSSProperties
  cameraPos?: { x: number; y: number; z: number }
  target?: { x: number; y: number; z: number }
  children?: React.ReactNode
}

export default function ThreeCanvas({
  className,
  style,
  cameraPos = { x: 0, y: -250, z: 180 },
  target = { x: 0, y: 0, z: 0 },
  children,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ctx, setCtx] = useState<ThreeCtx | null>(null)

  const scene = useMemo(() => {
    const s = new THREE.Scene()
    s.background = new THREE.Color(0x0b0f14)
    return s
  }, [])

  const camera = useMemo(() => {
    const c = new THREE.PerspectiveCamera(55, 1, 0.01, 200000)
    c.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
    c.up.set(0, 0, 1) // ENU Z-up
    c.lookAt(target.x, target.y, target.z)
    return c
  }, [cameraPos.x, cameraPos.y, cameraPos.z, target.x, target.y, target.z])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    camera.near = 0.01
    camera.far = 200000
    camera.updateProjectionMatrix()

    scene.add(new THREE.AmbientLight(0xffffff, 0.8))

    const dir = new THREE.DirectionalLight(0xffffff, 0.7)
    dir.position.set(300, -200, 400)
    scene.add(dir)

    const axes = new THREE.AxesHelper(50)
    scene.add(axes)

    const grid = new THREE.GridHelper(2000, 40)
    grid.rotation.x = Math.PI / 2
    scene.add(grid)

    const controls = new OrbitControls(camera, renderer.domElement)

    controls.target.set(target.x, target.y, target.z)
    controls.enableDamping = true
    controls.dampingFactor = 0.08

    controls.enablePan = true
    controls.panSpeed = 1.0
    controls.zoomSpeed = 2.0
    controls.rotateSpeed = 0.6

    controls.minDistance = 0.05
    controls.maxDistance = 50000

    controls.maxPolarAngle = Math.PI / 2 - 0.001

    // -----------------------------
    // WASD MOVEMENT
    // -----------------------------

    const keys: Record<string, boolean> = {}

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true
    }

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)

    const moveSpeed = 3

    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()

    // -----------------------------
    // RESIZE
    // -----------------------------

    const onResize = () => {
      const parent = canvas.parentElement
      const w = parent ? parent.clientWidth : window.innerWidth
      const h = parent ? parent.clientHeight : window.innerHeight

      renderer.setSize(w, h, false)

      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    onResize()
    window.addEventListener("resize", onResize)

    // -----------------------------
    // MAIN LOOP
    // -----------------------------

    let raf = 0

    const tick = () => {
      raf = requestAnimationFrame(tick)

      camera.getWorldDirection(forward)
      forward.z = 0
      forward.normalize()

      right.crossVectors(forward, camera.up).normalize()

      if (keys["KeyW"]) camera.position.addScaledVector(forward, moveSpeed)
      if (keys["KeyS"]) camera.position.addScaledVector(forward, -moveSpeed)
      if (keys["KeyA"]) camera.position.addScaledVector(right, -moveSpeed)
      if (keys["KeyD"]) camera.position.addScaledVector(right, moveSpeed)

      if (keys["KeyQ"]) camera.position.z -= moveSpeed
      if (keys["KeyE"]) camera.position.z += moveSpeed

      controls.target.copy(camera.position.clone().add(forward))

      controls.update()

      renderer.render(scene, camera)
    }

    tick()

    setCtx({ scene, camera, renderer })

    return () => {
      cancelAnimationFrame(raf)

      window.removeEventListener("resize", onResize)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)

      controls.dispose()
      renderer.dispose()

      setCtx(null)
    }
  }, [scene, camera, target.x, target.y, target.z])

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {ctx ? (
        <ThreeContext.Provider value={ctx}>{children}</ThreeContext.Provider>
      ) : null}
    </div>
  )
}