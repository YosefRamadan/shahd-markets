import logo from "@/assets/shahd-logo.png.asset.json";

type Props = {
  size?: number;
  className?: string;
  alt?: string;
};

export function Logo({ size = 40, className, alt = "أسواق شهد الفيوم - Shahd Markets" }: Props) {
  return (
    <img
      src={logo.url}
      alt={alt}
      width={size}
      height={size}
      className={
        "rounded-full bg-white object-contain shadow-[var(--shadow-soft)] ring-1 ring-border " +
        (className ?? "")
      }
      style={{ width: size, height: size }}
    />
  );
}
