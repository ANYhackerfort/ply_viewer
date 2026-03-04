import ThreeCanvas from "../components/ThreeCanvas"
import EnuMapPlane from "../components/EnuMapPlane"
import CameraPairsLayer from "../layers/CameraPairsLayer"
import PlyLayer from "../layers/PlyLayer"
import PlyBundle from "../components/PlyBundle"

export default function Viewer() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ThreeCanvas>

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

        {/* <PlyLayer
          plyUrl="/ply/MRL_sparse_0.ply"
          mode="mesh"
          pointSize={1.5}
          maxPoints={600000}
          liftU={-13}
          shift={{ e: 20, n: -60, u: 0 }}
          slantDeg={{ pitch: -2}}
        /> */}

        <PlyBundle
            plyUrls={[
                "/ply/MRL_sparse_0.ply",
                "/ply/MRL_sparse_1.ply",
                "/ply/MRL_sparse_2.ply",
            ]}
            mode="mesh"
            pointSize={1.5}
            maxPoints={600000}
            liftU={-13}
            shift={{ e: 20, n: -60, u: 0 }}
            slantDeg={{ pitch: -2 }}
            />

        <PlyBundle
            plyUrls={[
                "/ply/Marine_science_sparse_0.ply",
                "/ply/Marine_science_sparse_1.ply",
                "/ply/Marine_science_sparse_2.ply",
                "/ply/Marine_science_sparse_3.ply",
                "/ply/Marine_science_sparse_4.ply",
                "/ply/Marine_science_sparse_5.ply",
                "/ply/Marine_science_sparse_6.ply",
            ]}
            mode="mesh"
            pointSize={1.5}
            maxPoints={600000}
            liftU={-13}
            shift={{ e: 20, n: -60, u: 0 }}
            slantDeg={{ pitch: -2 }}
            />


        {/* <GaussianSplatPlyLayer
            splatUrl="/ply/gaussian_splat.ply"
            scale={1}
            liftU={20}
        /> */}

        {/* camera points + gps→colmap lines */}
        <CameraPairsLayer
          jsonUrl="/camera_poses/campbell/campbell_cameras.json"
        />

      </ThreeCanvas>
    </div>
  )
}