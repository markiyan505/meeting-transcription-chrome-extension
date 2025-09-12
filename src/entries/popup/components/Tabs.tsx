import React from "react";
import { Home, History, User } from "lucide-react";

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
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 text-sm font-medium transition-colors relative ${
              activeTab === id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {activeTab === id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;