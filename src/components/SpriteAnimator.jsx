import React, { useEffect, useState } from "react";

export default function SpriteAnimator({
  src,
  frameWidth,
  frameHeight,
  frames,        // preferred (used by PixelGarden)
  frameCount,    // fallback support
  fps = 8,
  scale = 1,
  flip = false,
}) {
  // Resolve total frames safely
  const totalFrames = frames ?? frameCount ?? 1;

  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (totalFrames <= 1) return;

    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % totalFrames);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [totalFrames, fps]);

  return (
    <div
      style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        backgroundImage: `url(${src})`,
        backgroundPosition: `-${frame * frameWidth}px 0px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        transform: flip ? "scaleX(-1)" : "none",
      }}
    />
  );
}
