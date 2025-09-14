import React from "react";
import { LucideIcon } from "lucide-react";
import { Typography } from "@/components/shared/ui/typography";
import { Toggle } from "@/components/shared/ui/toggle/Toggle";
import { Panel } from "@/components/shared/ui/Panel/Panel";

interface SettingItemProps {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  className = "",
}) => {
  return (
    <Panel variant="outline" size="sm" className={`p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <div>
            <Typography variant="title">{title}</Typography>
            <Typography variant="caption" color="muted">
              {description}
            </Typography>
          </div>
        </div>
        <Toggle
          checked={checked}
          onChange={onChange}
          size="default"
          variant="light"
        />
      </div>
    </Panel>
  );
};

export default SettingItem;
