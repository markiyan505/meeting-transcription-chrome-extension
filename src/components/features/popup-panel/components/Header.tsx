import React from "react";
import { Zap, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Toggle } from "@/components/shared/ui/toggle/Toggle";
import { Typography } from "@/components/shared/ui/typography";
import { Icon } from "@/components/shared/ui/icon/Icon";
import { Panel } from "@/components/shared/ui/panel/Panel";
import { useExtensionCommands } from "@/components/shared/hooks/useExtensionCommands";

interface HeaderProps {
  isActive: boolean;
  statusMessage?: string;
  isSupported: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isActive,
  statusMessage,
  isSupported,
}) => {
  const statusText = isActive ? "Active" : "Inactive";
  const { toggleExtension } = useExtensionCommands();
  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <Typography
            variant="title"
            as="h1"
            className="text-base font-semibold"
          >
            Caption Recorder
          </Typography>
        </div>
        <Toggle
          checked={isActive}
          onChange={toggleExtension}
          size="default"
          variant="default"
        />
      </div>

      <div className="mt-2 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center w-14 gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                isActive ? "bg-success" : "bg-muted-foreground"
              }`}
            ></div>
            <Typography
              variant="caption"
              color={isActive ? "success" : "muted"}
            >
              {statusText}
            </Typography>
          </div>

          {!isSupported && (
            <div className="flex items-center space-x-1">
              <Icon icon={AlertCircle} color="warning" />
              <Typography variant="caption" color="warning">
                Unsupported site
              </Typography>
            </div>
          )}
        </div>
        <Typography variant="caption" color="muted">
          v1.0.0
        </Typography>
      </div>
      {statusMessage && (
        <Panel variant="warning" size="sm">
          <Typography variant="caption" color="warning">
            {statusMessage}
          </Typography>
        </Panel>
      )}
    </div>
  );
};

export default Header;
