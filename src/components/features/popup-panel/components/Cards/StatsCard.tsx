import React from "react";
import { Panel } from "@/components/shared/ui/panel/Panel";
import { Typography } from "@/components/shared/ui/typography";
import { Icon } from "@/components/shared/ui/icon/Icon";
import { LucideIcon } from "lucide-react";
import type { IconColor } from "@/components/shared/ui/icon/Icon.types";

interface StatsCardProps {
  icon?: LucideIcon;
  iconColor?: IconColor;
  label: string;
  value: string | number;
  variant?: "default" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
  showIcon?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon: IconComponent,
  iconColor = "muted",
  label,
  value,
  variant = "default",
  size = "sm",
  className = "",
  showIcon = true,
}) => {
  return (
    <Panel variant={variant} size={size} className={`text-center ${className}`}>
      {showIcon && IconComponent && (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground mb-1">
          <Icon icon={IconComponent} color={iconColor} />
          <Typography variant="caption" color="muted">
            {label}
          </Typography>
        </div>
      )}
      {!showIcon && (
        <Typography variant="caption" color="muted" className="mb-1">
          {label}
        </Typography>
      )}
      <Typography variant="stat">{value}</Typography>
    </Panel>
  );
};

export default StatsCard;
