import { cn } from "@renderer/lib/utils";

export const PingPoint = (props: {
  colorClassName?: string;
  size?: number;
  className?: string;
}) => {
  const { colorClassName = "bg-sky-500", size = 2, className } = props;

  return (
    <span className={cn(`relative flex h-${size} w-${size}`, className)}>
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClassName}`}
      ></span>
      <span
        className={`relative inline-flex rounded-full h-${size} w-${size} ${colorClassName}`}
      ></span>
    </span>
  );
};
