import React from "react";
import {
  Settings,
  Zap,
  Eye,
  EyeOff,
  Palette,
  ToggleLeft,
  ToggleRight,
  Info,
  ExternalLink,
} from "lucide-react";
import { useExtensionStore } from "@/store/useExtensionStore";
import { useFloatPanelStore } from "@/store/useFloatPanelStore";

const PopupApp: React.FC = () => {
  const { isActive, settings, setActive, setTheme, setAutoOpen } =
    useExtensionStore();

  const { isVisible, show, hide } = useFloatPanelStore();

  const handleToggleActive = () => {
    setActive(!isActive);
  };

  const handleToggleTheme = () => {
    setTheme(settings.theme === "light" ? "dark" : "light");
  };

  const handleToggleAutoOpen = () => {
    setAutoOpen(!settings.autoOpen);
  };

  const handleToggleFloatPanel = () => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              React Extension
            </h1>
          </div>
          <button
            onClick={handleToggleActive}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? "bg-primary-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isActive ? (
              <Eye className="w-4 h-4 text-green-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
            <span
              className={`text-sm font-medium ${
                isActive ? "text-green-600" : "text-gray-500"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <span className="text-xs text-gray-500">v1.0.0</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button
            onClick={handleToggleFloatPanel}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Float Panel
              </span>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                isVisible
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isVisible ? "Visible" : "Hidden"}
            </span>
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Settings</h3>
        <div className="space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Palette className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Theme</span>
                <p className="text-xs text-gray-500 capitalize">
                  {settings.theme}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleTheme}
              className="flex items-center space-x-2"
            >
              {settings.theme === "light" ? (
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              ) : (
                <ToggleRight className="w-5 h-5 text-primary-600" />
              )}
            </button>
          </div>

          {/* Auto Open Toggle */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Auto Open
                </span>
                <p className="text-xs text-gray-500">
                  {settings.autoOpen ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleAutoOpen}
              className="flex items-center space-x-2"
            >
              {settings.autoOpen ? (
                <ToggleRight className="w-5 h-5 text-primary-600" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <Info className="w-3 h-3" />
          <span>Built with React + TypeScript</span>
        </div>
      </div>
    </div>
  );
};

export default PopupApp;
