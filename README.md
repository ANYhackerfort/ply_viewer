# 3D Reconstruction Web Viewer

> React + Three.js viewer for sparse point clouds and Gaussian splats, aligned to ENU coordinates.

---

## Adding a Point Cloud

Drop your PLY files into `public/ply/` then add a `PlyBundle` into `Viewer.tsx` inside the `<ThreeCanvas>`:

```tsx
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
```

### Props Reference

| Prop | Description |
|---|---|
| `plyUrls` | Array of PLY file paths from `public/ply/` — bundle them together if they belong to the same model |
| `mode` | `"points"` or `"mesh"` |
| `pointSize` | How big each point renders — increase to make the cloud look denser |
| `maxPoints` | Cap on how many points are rendered — lower this if the scene is lagging |
| `liftU` | Z-offset in meters — needed for some models as an error correction because the map can sometimes alias it |
| `shift` | ENU offset in meters — this is automatically calculated by the backend script to align the model to ENU coordinates |
| `slantDeg` | Not needed, but there to better align if necessary (`pitch`, `yaw`, `roll` in degrees) |
| `scale` | Set to `1.2` to match the scale of the map — the map was also scaled up to make everything bigger in the canvas space |

---

## What's Currently in the Scene

- **ENU coordinate center** — everything is aligned to a shared ENU origin
- **Sun/HDR background** — lights up the entire scene so models render clearly

---

## Adding New Components

New things go in the `components/` folder, then get added into `<ThreeCanvas>` in `Viewer.tsx` — things like text labels, markers, overlays, etc.

```
src/
├── components/       ← add new components here
│   ├── ThreeCanvas.tsx
│   ├── EnuMapPlane.tsx
│   └── YourNewComponent.tsx
├── layers/
│   ├── PlyLayer.tsx
│   └── CameraPairsLayer.tsx
└── pages/
    └── Viewer.tsx    ← add components into the canvas here
```

Then in `Viewer.tsx`:

```tsx
<ThreeCanvas>
  <HDRBackground />
  <EnuMapPlane ... />
  <PlyBundle ... />
  <YourNewComponent />   {/* ← add it here */}
</ThreeCanvas>
```

> [!NOTE]
> Any component that needs to add objects to the Three.js scene should use `useContext(ThreeContext)` to access `scene`, `camera`, and `renderer` — not any React Three Fiber hooks.