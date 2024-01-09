import { LoaderIcon } from "lucide-react";

export const LoaderSpin = () => {
  return (
    <div className="h-full w-full px-4 py-6 lg:px-8 flex justify-center items-center">
      <LoaderIcon className="text-muted-foreground animate-spin" />
    </div>
  );
};
