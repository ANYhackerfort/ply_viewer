// PlyBundle.tsx
import React from "react"
import PlyLayer from "../layers/PlyLayer"

type SharedProps = Omit<
  React.ComponentProps<typeof PlyLayer>,
  "plyUrl"
>

type Props = SharedProps & {
  plyUrls: string[]
}

export default function PlyBundle({
  plyUrls,
  ...shared
}: Props) {
  return (
    <>
      {plyUrls.map((url) => (
        <PlyLayer key={url} plyUrl={url} {...shared} />
      ))}
    </>
  )
}