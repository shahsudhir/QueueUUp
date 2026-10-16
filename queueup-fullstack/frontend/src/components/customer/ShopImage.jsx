import { useState } from "react";
import { Scissors } from "lucide-react";

// Shows the shop's photo when one is given; otherwise a barber-pole pattern.
// (Per-shop photo upload can be added later; until then every shop gets the pattern.)
export default function ShopImage({ src, alt = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="grid h-44 place-items-center bg-[repeating-linear-gradient(135deg,var(--color-brand-600)_0_18px,white_18px_30px,var(--color-pole)_30px_48px,white_48px_60px)] opacity-90">
        <span className="grid size-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-lg">
          <Scissors className="size-7" />
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="block h-44 w-full object-cover"
    />
  );
}
