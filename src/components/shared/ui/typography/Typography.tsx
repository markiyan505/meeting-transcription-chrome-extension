import * as React from "react";
import { cn } from "@/components/shared/lib/utils";
import { TypographyProps, TypographyVariant } from "./Typography.types";
import { typographyVariants } from "./typography-variants";

const getDefaultTag = (
  variant: TypographyVariant
): keyof JSX.IntrinsicElements => {
  switch (variant) {
    case "heading":
      return "h3";
    case "title":
      return "p";
    case "caption":
      return "p";
    case "stat":
      return "p";
    default:
      return "p";
  }
};

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  (
    { children, variant = "title", color = "default", as, className, ...props },
    ref
  ) => {
    const Component = as || getDefaultTag(variant || "title");
    return React.createElement(
      Component,
      {
        ref,
        className: cn(
          typographyVariants({
            variant: variant || "title",
            color: color || "default",
          }),
          className
        ),
        ...props,
      },
      children
    );
  }
);
Typography.displayName = "Typography";

export { Typography };
