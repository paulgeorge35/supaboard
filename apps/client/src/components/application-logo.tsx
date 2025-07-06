import { cn } from "@/lib/utils";

type ApplicationLogoProps = {
  logo: string | null | undefined;
  alt: string;
  invert?: boolean;
  className?: string;
};

export function ApplicationLogo({
  logo,
  alt,
  invert = true,
  className = "size-8",
}: ApplicationLogoProps) {
  if (!logo) return null;

  return (
    <img
      src={logo}
      alt={alt}
      className={cn(className, {
        invert,
      })}
    />
  );
}
