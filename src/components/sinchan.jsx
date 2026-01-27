import SpriteAnimator from "./SpriteAnimator";

const SPRITES = {
  idle: { src: "/pixel/shinchan/idle.png", frames: 4, fps: 4 },
  walk: { src: "/pixel/shinchan/walk.png", frames: 6, fps: 10 },
  talk: { src: "/pixel/shinchan/talk.png", frames: 4, fps: 8 },
  angry: { src: "/pixel/shinchan/angry.png", frames: 4, fps: 6 },
  facepalm: { src: "/pixel/shinchan/facepalm.png", frames: 4, fps: 5 },
  happy: { src: "/pixel/shinchan/happy.png", frames: 4, fps: 8 },
};

export default function Shinchan({
  state = "idle",
  facing = "right",
}) {
  const sprite = SPRITES[state] || SPRITES.idle;

  return (
    <div
      style={{
        transform: facing === "left" ? "scaleX(-1)" : "scaleX(1)",
      }}
    >
      <SpriteAnimator
        src={sprite.src}
        frameWidth={64}   // adjust ONLY if your sprite sheet differs
        frameHeight={64}
        frames={sprite.frames}
        fps={sprite.fps}
        scale={1}
      />
    </div>
  );
}
