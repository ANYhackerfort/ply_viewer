import { useEffect, useContext } from "react"
import * as THREE from "three"
import { ThreeContext } from "../components/ThreeCanvas"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"

import ThreeCanvas from "../components/ThreeCanvas"
import EnuMapPlane from "../components/EnuMapPlane"
import CameraPairsLayer from "../layers/CameraPairsLayer"
import PlyLayer from "../layers/PlyLayer"
import PlyBundle from "../components/PlyBundle"

function HDRBackground() {
  const ctx = useContext(ThreeContext)

  useEffect(() => {
    if (!ctx) return
    new RGBELoader().load("/hdr/normal.hdr", (texture: THREE.Texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      texture.rotation = Math.PI / 2
      texture.center.set(0.5, 0.5)
      ctx.scene.background = texture
    })
  }, [ctx])

  return null
}

export default function Viewer() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ThreeCanvas>
        <HDRBackground />

        {/* UCSB map */}
        <EnuMapPlane
          textureUrl="/ucsb_map.png"
          width_m={1200}
          height_m={900}
          mapCenterENU={{ e: 140, n: -140, u: 0 }}
          yaw_deg={0}
          originLineDown_m={60}
          scale={1.6}
        />

        <PlyLayer
          plyUrl="/ply/campbell_sparse.ply"
          mode="points"
          pointSize={2}
          maxPoints={600000}
          liftU={20}
        />

        <PlyBundle
          plyUrls={[
            "/ply/Marine_science_sparse_2.ply",
            "/ply/Marine_science_sparse_3.ply",
            "/ply/Marine_science_sparse_4.ply",
            "/ply/Marine_science_sparse_5.ply",
            "/ply/Marine_science_sparse_6.ply",
          ]}
          mode="mesh"
          pointSize={1.5}
          maxPoints={600000}
          liftU={2}
          shift={{ e: 645, n: -235, u: 0 }}
          slantDeg={{ pitch: -2 }}
        />

        <PlyBundle
          plyUrls={[
            // "/ply/Marine_science_sparse_0.ply",
            "/ply/Marine_science_sparse_1.ply",
 
          ]}
          mode="mesh"
          pointSize={1.5}
          maxPoints={600000}
          liftU={-4}
          shift={{ e: 658, n: -215, u: 0 }}
          slantDeg={{ pitch: -2 }}
        />

        <PlyBundle
          plyUrls={[
            "/ply/Ocean_science_0.ply",
            "/ply/Ocean_science_1.ply",
          ]}
          mode="mesh"
          pointSize={1.6}
          maxPoints={600000}
          liftU={2}
          shift={{ e: 685, n: -305, u: 0 }}
          slantDeg={{ pitch: 0 }}
          scale={1.2}
        />

        <PlyBundle
          plyUrls={[
            "/ply/chemistry_sparse_0.ply",
            "/ply/chemistry_sparse_1.ply",
            "/ply/chemistry_sparse_2.ply",
            "/ply/chemistry_sparse_3.ply",
            "/ply/chemistry_sparse_4.ply",
          ]}
          mode="mesh"
          pointSize={1.6}
          maxPoints={600000}
          liftU={2}
          shift={{ e: 515, n: 85, u: 0 }}
          slantDeg={{ pitch: 0 }}
          scale={1}
        />

        <PlyBundle
          plyUrls={[
            "/ply/kavli_sparse_0.ply",
            "/ply/kavli_sparse_1.ply",
          ]}
          mode="mesh"
          pointSize={1.6}
          maxPoints={600000}
          liftU={16}
          shift={{ e: 799, n: 51, u: 0 }}
          slantDeg={{ pitch: 0 }}
          scale={1.2}
        />

        <PlyBundle
          plyUrls={[
            "/ply/MRL_sparse_0.ply",
            "/ply/MRL_sparse_1.ply",
            "/ply/MRL_sparse_2.ply",
          ]}
          mode="mesh"
          pointSize={1.6}
          maxPoints={600000}
          liftU={-0.2}
          shift={{ e: 636, n: -45, u: 0 }}
          slantDeg={{ pitch: 0 }}
          scale={1.2}
        />

          <PlyBundle
          plyUrls={[
            "/ply/HFH_sparse_0.ply",
            "/ply/HFH_sparse_1.ply",
          ]}
          mode="mesh"
          pointSize={1.5}
          maxPoints={600000}
          liftU={2}
          shift={{ e: 766, n: -43, u: 0 }}
          slantDeg={{ pitch: 0 }}
          scale={1.2}
        />


        <CameraPairsLayer
          jsonUrl="/camera_poses/campbell/campbell_cameras.json"
        />
      </ThreeCanvas>
    </div>
  )
}