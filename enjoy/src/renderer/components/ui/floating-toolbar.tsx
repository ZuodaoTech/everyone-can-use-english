import { Button } from "@renderer/components/ui";
import { cn } from "@renderer/lib/utils";
import * as React from "react";
import { Tooltip } from "react-tooltip";

export const FloatingToolbar = (props: {
  className?: string;
  children: React.ReactElement[] | React.ReactElement;
}) => {
  const { className, children } = props;

  return (
    <div
      className={cn(
        "px-4 h-auto w-20 z-30 fixed bottom-12 left-[50%] ml-[380px] xl:ml-[480px] 2xl:ml-[515px]",
        className
      )}
    >
      <div className="w-full space-y-4">{children}</div>
      <Tooltip id="floating-toolbar-tooltip" />
    </div>
  );
};

export const ToolbarButton = React.forwardRef(
  (
    props: {
      className?: string;
      disabled?: boolean;
      toggled: boolean;
      onClick: () => void;
      children: React.ReactElement;
      tooltip?: string;
    },
    forwardedRef: React.Ref<HTMLButtonElement>
  ) => {
    const { className, disabled = false, toggled, onClick, tooltip } = props;

    return (
      <Button
        ref={forwardedRef}
        disabled={disabled}
        variant="default"
        data-tooltip-id="floating-toolbar-tooltip"
        data-tooltip-content={tooltip}
        className={cn(
          `rounded-full p-3 h-12 w-12 ${
            toggled
              ? "bg-primary dark:bg-background text-background dark:text-foreground"
              : "bg-background dark:bg-muted text-muted-foreground hover:text-background "
          }`,
          className
        )}
        onClick={onClick}
      >
        {props.children}
      </Button>
    );
  }
);
