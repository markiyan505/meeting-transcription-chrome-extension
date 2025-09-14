import React, { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { Typography } from "@/components/shared/ui/typography";
import { Button } from "@/components/shared/ui/button/Button";
import { Panel } from "@/components/shared/ui/Panel/Panel";
import { Icon } from "@/components/shared/ui/Icon/Icon";

interface TokenStatusProps {
  tokenExpiration?: Date | null;
  onRefreshToken?: () => void;
  className?: string;
}

const TokenStatus: React.FC<TokenStatusProps> = ({
  tokenExpiration: propTokenExpiration,
  onRefreshToken,
  className = "",
}) => {
  // Use prop token expiration or create a mock one
  const [tokenExpiration, setTokenExpiration] = useState<Date | null>(
    propTokenExpiration || null
  );
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<string>("");

  useEffect(() => {
    // If no token expiration provided, create a mock one (24 hours from now)
    if (!propTokenExpiration) {
      const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setTokenExpiration(expirationTime);
    } else {
      setTokenExpiration(propTokenExpiration);
    }
  }, [propTokenExpiration]);

  useEffect(() => {
    if (!tokenExpiration) return;

    const updateTimeUntilExpiration = () => {
      const now = new Date();
      const diff = tokenExpiration.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilExpiration("Expired");
        return;
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const totalMinutes = Math.floor(diff / (1000 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Show hours and minutes if more than 1 hour remaining
      if (totalHours > 0) {
        setTimeUntilExpiration(`${totalHours}h ${minutes}m`);
      }
      // Show only minutes if less than 1 hour but more than 1 minute
      else if (totalMinutes > 0) {
        setTimeUntilExpiration(`${totalMinutes}m`);
      }
      // Show seconds if less than 1 minute
      else {
        const seconds = Math.floor(diff / 1000);
        setTimeUntilExpiration(`${seconds}s`);
      }
    };

    // Update immediately
    updateTimeUntilExpiration();

    // Update every 30 seconds for more stable display
    const interval = setInterval(updateTimeUntilExpiration, 30000);

    return () => clearInterval(interval);
  }, [tokenExpiration]);

  const handleRefreshToken = () => {
    if (onRefreshToken) {
      onRefreshToken();
    } else {
      // Mock refresh - in real app this would open auth URL
      window.open("https://auth.example.com/refresh", "_blank");
    }
  };

  return (
    <div className={`flex flex-col items-end space-y-2 ${className}`}>
      <Panel variant="outline" size="sm" className="px-3 py-2">
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <Icon icon={Clock} color="muted" />
            <Typography variant="caption" color="muted">
              Token expires in:
            </Typography>
          </div>
          <Typography
            variant="caption"
            color={timeUntilExpiration === "Expired" ? "danger" : "default"}
            className="font-medium"
          >
            {timeUntilExpiration}
          </Typography>
        </div>
      </Panel>
      <Button
        onClick={handleRefreshToken}
        variant="outline"
        size="sm"
        leftIcon={<RefreshCw />}
        className="text-xs"
      >
        Refresh Token
      </Button>
    </div>
  );
};

export default TokenStatus;
