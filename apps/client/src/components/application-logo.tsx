import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type ApplicationLogoProps = {
  logo: string | null | undefined;
  alt: string;
  className?: string;
};

export function ApplicationLogo({
  logo,
  alt,
  className = "size-8",
}: ApplicationLogoProps) {
  const [isDarkLogo, setIsDarkLogo] = useState(false);
  const [totalPixels, setTotalPixels] = useState(0);
  const [darkPixels, setDarkPixels] = useState(0);

  useEffect(() => {
    if (!logo) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalPixels = 0;
      let darkPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          // Only count non-transparent pixels
          totalPixels++;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate perceived brightness
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 128) {
            // Consider it dark if brightness < 128
            darkPixels++;
          }
        }
      }

      // If more than 50% of non-transparent pixels are dark, consider it a dark logo
      setIsDarkLogo(totalPixels > 0 && darkPixels / totalPixels > 0.5);
      setTotalPixels(totalPixels);
      setDarkPixels(darkPixels);
    };

    img.onerror = () => {
      // If image fails to load, assume it's not dark
      setIsDarkLogo(false);
    };

    img.src = logo;
  }, [logo]);

  if (!logo) return null;

  return (
    <img
      src={logo}
      alt={`${alt} - Total ${totalPixels} pixels, ${darkPixels} dark pixels`}
      className={cn(className, {
        invert: isDarkLogo,
      })}
    />
  );
}
