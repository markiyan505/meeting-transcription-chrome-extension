import React, { useEffect, useState } from "react";
import { Clock, Database, RefreshCw } from "lucide-react";
import { Typography } from "@/components/shared/ui/typography";
import { Panel } from "@/components/shared/ui/panel/Panel";
import { Button } from "@/components/shared/ui/button/Button";
import { Icon } from "@/components/shared/ui/icon/Icon";

interface CacheInfoProps {
  className?: string;
}

interface CacheInfoData {
  hasCache: boolean;
  cachedAt?: number;
  isExpired: boolean;
  ageMinutes?: number;
}

const CacheInfo: React.FC<CacheInfoProps> = ({ className }) => {
  const [cacheInfo, setCacheInfo] = useState<CacheInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCacheInfo = async () => {
    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: "QUERY.USER.GET_CACHE_INFO",
      });

      if (response?.success) {
        setCacheInfo(response.cacheInfo);
      }
    } catch (error) {
      console.error("Error fetching cache info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheInfo();
  }, []);

  if (!cacheInfo) {
    return null;
  }

  const formatCacheAge = (ageMinutes?: number) => {
    if (ageMinutes === undefined || ageMinutes === null) return "Unknown";
    if (ageMinutes < 1) return "Just now";
    if (ageMinutes < 60) return `${Math.floor(ageMinutes)}m ago`;
    const hours = Math.floor(ageMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getCacheStatusColor = () => {
    if (!cacheInfo.hasCache) return "muted";
    if (cacheInfo.isExpired) return "destructive";
    return "success";
  };

  const getCacheStatusText = () => {
    if (!cacheInfo.hasCache) return "No cache";
    if (cacheInfo.isExpired) return "Cache expired";
    return "Cache fresh";
  };

  return (
    <Panel variant="default" size="default" className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon icon={Database} size="sm" />
          <Typography variant="caption" className="font-medium">
            Cache Status
          </Typography>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchCacheInfo}
          disabled={isLoading}
          className="flex items-center space-x-1"
        >
          <Icon
            icon={RefreshCw}
            size="sm"
            className={isLoading ? "animate-spin" : ""}
          />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Typography variant="caption" color="muted">
            Status
          </Typography>
          <Typography variant="caption" color={getCacheStatusColor()}>
            {getCacheStatusText()}
          </Typography>
        </div>

        {cacheInfo.hasCache && cacheInfo.cachedAt && (
          <>
            <div className="flex justify-between items-center">
              <Typography variant="caption" color="muted">
                Age
              </Typography>
              <Typography variant="caption">
                {formatCacheAge(cacheInfo.ageMinutes)}
              </Typography>
            </div>

            <div className="flex justify-between items-center">
              <Typography variant="caption" color="muted">
                Cached At
              </Typography>
              <Typography variant="caption">
                {new Date(cacheInfo.cachedAt).toLocaleTimeString()}
              </Typography>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
};

export default CacheInfo;
