import React, { useEffect, useState } from "react"; // 🔥 FIXED: Added React import

export default function SpriteAnimator({
  src,
  frameWidth,
  frameHeight,
  frameCount, // Changed from 'frames' to match usage in PixelGarden
  fps = 8,
  scale = 1,
  flip = false // Added flip support for direction
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, 1000 / fps);

    return () => clearInterval(id);
  }, [frameCount, fps]);

  return (
    <div
      style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        backgroundImage: `url(${src})`,
        backgroundPosition: `-${frame * frameWidth}px 0px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        transform: flip ? "scaleX(-1)" : "none", // Handle flipping
      }}
    />
  );
}