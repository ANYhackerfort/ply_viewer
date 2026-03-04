declare module "@mkkellogg/gaussian-splats-3d" {
  import * as THREE from "three"

  export class Viewer {
    constructor(options: {
      renderer: THREE.WebGLRenderer
      scene: THREE.Scene
      camera: THREE.Camera
    })

    addSplatScene(
      url: string,
      options?: {
        splatAlphaRemovalThreshold?: number
        showLoadingUI?: boolean
      }
    ): Promise<void>

    render(): void
    dispose(): void
  }
}