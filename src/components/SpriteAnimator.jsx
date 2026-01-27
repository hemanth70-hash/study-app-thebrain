import { useEffect, useState } from "react";

export default function SpriteAnimator({
  src,
  frameWidth,
  frameHeight,
  frames,
  fps = 8,
  scale = 1,
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame(f => (f + 1) % frames);
    }, 1000 / fps);

    return () => clearInterval(id);
  }, [frames, fps]);

  return (
    <div
      style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        backgroundImage: `url(${src})`,
        backgroundPosition: `-${frame * frameWidth}px 0px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        transform: "translateZ(0)",
      }}
    />
  );
}
