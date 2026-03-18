import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
// @ts-ignore
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"

type HDRBackgroundProps = {
  url: string
}

export default function HDRBackground({ url }: HDRBackgroundProps) {
  const { scene } = useThree()

  useEffect(() => {
    let disposed = false

    new RGBELoader().load(url, (texture) => {
      if (disposed) {
        texture.dispose()
        return
      }

      texture.mapping = THREE.EquirectangularReflectionMapping
      scene.background = texture
    })

    return () => {
      disposed = true
      scene.background = null
    }
  }, [scene, url])

  return null
}