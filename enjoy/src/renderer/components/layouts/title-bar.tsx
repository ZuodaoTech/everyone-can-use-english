import { Button } from "@renderer/components/ui";
import { MaximizeIcon, MenuIcon, MinimizeIcon, XIcon } from "lucide-react";

export const TitleBar = () => {
  return (
    <div className="z-50 h-8 w-full bg-muted draggable-region flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-none non-draggable-region hover:bg-primary/10"
        >
          <MenuIcon className="size-4" />
        </Button>
      </div>

      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-none non-draggable-region hover:bg-primary/10"
        >
          <MinimizeIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-none non-draggable-region hover:bg-primary/10"
        >
          <MaximizeIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-none non-draggable-region hover:bg-destructive"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};
