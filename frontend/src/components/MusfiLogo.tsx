export function MusfiLogo({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/musfi-logo.png"
      alt="Musfi Hijab"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
