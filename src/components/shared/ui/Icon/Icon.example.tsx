import React from "react";
import {
  Play,
  Pause,
  Square,
  Download,
  Trash2,
  Settings,
  User,
  Video,
  Phone,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  FileText,
  Users,
  Clock,
  Zap,
  Bell,
  Shield,
} from "lucide-react";
import { Icon } from "./Icon";

// Приклад використання Icon компонента
export const IconExamples: React.FC = () => {
  const handleIconClick = (iconName: string) => {
    console.log(`Clicked on ${iconName}`);
  };

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-6">Icon Examples</h2>

      {/* Sizes */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Icon icon={Play} size="sm" tooltip="Small" />
          <Icon icon={Play} size="default" tooltip="Default" />
          <Icon icon={Play} size="lg" tooltip="Large" />
          <Icon icon={Play} size="xl" tooltip="Extra Large" />
        </div>
      </section>

      {/* Colors */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Colors</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Icon icon={Settings} color="default" tooltip="Default" />
          <Icon icon={Settings} color="primary" tooltip="Primary" />
          <Icon icon={Settings} color="success" tooltip="Success" />
          <Icon icon={Settings} color="warning" tooltip="Warning" />
          <Icon icon={Settings} color="danger" tooltip="Danger" />
          <Icon icon={Settings} color="muted" tooltip="Muted" />
          <Icon icon={Settings} color="accent" tooltip="Accent" />
        </div>
      </section>

      {/* Real-world Examples */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Real-world Examples</h3>
        <div className="space-y-4">
          {/* Stats Display */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Icon icon={FileText} color="muted" size="sm" />
              <span className="text-sm">245 captions</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Users} color="muted" size="sm" />
              <span className="text-sm">8 attendees</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Clock} color="muted" size="sm" />
              <span className="text-sm">1h 25m</span>
            </div>
            <Icon
              icon={CheckCircle}
              color="success"
              size="sm"
              tooltip="Synced"
            />
          </div>

          {/* Comparison Test */}
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium">Comparison Test:</h4>
            <div className="flex items-center gap-2">
              <Icon icon={CheckCircle} color="success" size="sm" />
              <span className="text-sm">Without tooltip</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon
                icon={CheckCircle}
                color="success"
                size="sm"
                tooltip="With tooltip"
              />
              <span className="text-sm">With tooltip</span>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="flex items-center gap-2 p-4 border rounded-lg">
            <Icon icon={Settings} color="muted" size="sm" />
            <span className="text-sm">Settings</span>
            <Icon icon={User} color="muted" size="sm" />
            <span className="text-sm">Profile</span>
            <Icon icon={Bell} color="muted" size="sm" />
            <span className="text-sm">Notifications</span>
            <Icon icon={Shield} color="muted" size="sm" />
            <span className="text-sm">Privacy</span>
          </div>
        </div>
      </section>

      {/* Disabled States */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Disabled States</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Icon icon={Play} disabled tooltip="This tooltip won't show" />
          <Icon
            icon={Download}
            disabled
            size="lg"
            tooltip="This tooltip won't show"
          />
          <Icon
            icon={Settings}
            disabled
            color="primary"
            tooltip="This tooltip won't show"
          />
        </div>
      </section>

      {/* Panel Test */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Panel Test</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="text-sm font-medium mb-2">Panel Variants:</h4>
            <div className="space-y-2">
              <div className="p-2 bg-card border border-border rounded-lg">
                <span className="text-xs text-foreground">Default Panel</span>
              </div>
              <div className="p-2 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800 rounded-lg">
                <span className="text-xs text-amber-500">Warning Panel</span>
              </div>
              <div className="p-2 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 rounded-lg">
                <span className="text-xs text-red-500">Danger Panel</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
