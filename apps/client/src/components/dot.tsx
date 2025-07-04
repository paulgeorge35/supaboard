import { Status } from "@/lib/query";
import colors from "tailwindcss/colors";
import { cn } from "../lib/utils";

type DotProps = {
  status: Status;
};

export const Dot = ({ status }: DotProps) => {
  // Safely extract color and shade from status.color
  const colorParts = status.color?.split("-") || [];
  const color = colorParts[0] as Exclude<
    keyof typeof colors,
    "white" | "black" | "transparent" | "inherit" | "current"
  >;
  const shade = colorParts[1] as keyof (typeof colors)[typeof color];

  // Get the color value safely
  const colorValue = colors[color]?.[shade];

  return (
    <div
      className={cn("size-2 rounded-full shrink-0 bg-gray-500")}
      style={{
        backgroundColor: colorValue || "#6b7280", // fallback to gray-500
      }}
    />
  );
};
