import React from "react";
import { Home, History, User } from "lucide-react";
import { Icon } from "@/components/shared/ui/icon/Icon";
import { Button } from "@/components/shared/ui/button/Button";
import { Typography } from "@/components/shared/ui/typography";

export type TabType = "home" | "records" | "profile";

interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "home" as TabType, label: "Home", icon: Home },
    { id: "records" as TabType, label: "Records", icon: History },
    { id: "profile" as TabType, label: "Profile", icon: User },
  ];

  return (
    <div className="bg-card border-b border-border">
      <div className="flex">
        {tabs.map(({ id, label, icon: icon }) => (
          <Button
            key={id}
            onClick={() => onTabChange(id)}
            variant="ghost"
            className="rounded-none relative"
          >
            <Icon icon={icon} />
            <Typography variant="caption">{label}</Typography>
            {activeTab === id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
