import { useEffect, useState } from "react";

export default function SpriteAnimator({
  src,
  frameCount,
  frameWidth = 64,
  frameHeight = 64,
  fps = 6,
  flip = false,
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [frameCount, fps]);

  return (
    <div
      style={{
        width: frameWidth,
        height: frameHeight,
        backgroundImage: `url(${src})`,
        backgroundPosition: `-${frame * frameWidth}px 0px`,
        backgroundSize: `${frameCount * frameWidth}px ${frameHeight}px`,
        imageRendering: "pixelated",
        transform: flip ? "scaleX(-1)" : "scaleX(1)",
      }}
    />
  );
}
