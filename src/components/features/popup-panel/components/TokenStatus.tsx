import React, { useState, useEffect } from "react";
import { Clock, RefreshCw, AlertCircle } from "lucide-react";
import { Typography } from "@/components/shared/ui/typography";
import { Button } from "@/components/shared/ui/button/Button";
import { Panel } from "@/components/shared/ui/panel/Panel";
import { Icon } from "@/components/shared/ui/icon/Icon";

interface TokenStatusProps {
  tokenExpiresAt?: number;
  onRefreshToken?: () => void;
  className?: string;
  isAuthenticated?: boolean;
}

const TokenStatus: React.FC<TokenStatusProps> = ({
  tokenExpiresAt,
  onRefreshToken,
  className = "",
  isAuthenticated = false,
}) => {
  const [tokenExpiration, setTokenExpiration] = useState<Date | null>(null);
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (tokenExpiresAt) {
      setTokenExpiration(new Date(tokenExpiresAt * 1000));
    } else {
      setTokenExpiration(null);
    }
  }, [tokenExpiresAt]);

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

    updateTimeUntilExpiration();

    const interval = setInterval(updateTimeUntilExpiration, 30000);

    return () => clearInterval(interval);
  }, [tokenExpiration]);

  const handleRefreshToken = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      if (onRefreshToken) {
        await onRefreshToken();
      } else {
        const response = await chrome.runtime.sendMessage({
          type: "COMMAND.AUTH.REFRESH_TOKEN",
        });

        if (response?.success) {
          const newExpiration = new Date(response.expiresAt);
          setTokenExpiration(newExpiration);
        } else {
          console.error("Failed to refresh token:", response?.error);
        }
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`flex flex-col items-end space-y-2 ${className}`}>
        <Panel variant="warning" size="sm" className="px-3 py-2">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2">
              <Icon icon={AlertCircle} color="warning" />
              <Typography variant="caption" color="warning">
                Not authenticated
              </Typography>
            </div>
          </div>
        </Panel>
        <Button
          onClick={() => window.open("http://localhost:3000/login", "_blank")}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Go to Login
        </Button>
      </div>
    );
  }

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
            color={
              timeUntilExpiration === "Expired" ? "destructive" : "default"
            }
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
        disabled={isRefreshing}
      >
        {isRefreshing ? "Refreshing..." : "Refresh Token"}
      </Button>
    </div>
  );
};

export default TokenStatus;
