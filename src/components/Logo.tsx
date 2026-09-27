import emblemAsset from "@/assets/alamos-emblem.png.asset.json";

type LogoProps = {
  variant?: "full" | "emblem" | "lockup";
  className?: string;
  size?: number;
};

/** Álamos Shop brand mark. Never restyle or distort. */
export function Logo({ variant = "lockup", className = "", size = 40 }: LogoProps) {
  if (variant === "lockup") {
    return (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        <img
          src={emblemAsset.url}
          alt="Álamos Shop"
          width={size}
          height={size}
          className="object-contain"
          style={{ width: size, height: size }}
        />
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-tight text-primary">
            Álamos Shop
          </span>
          <span className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            De estudiantes
          </span>
        </span>
      </span>
    );
  }

  return (
    <img
      src={emblemAsset.url}
      alt="Álamos Shop"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
