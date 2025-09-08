// src/floatpanel/FloatPanelApp.tsx
import React, { useState, useCallback } from "react";
import {
  X,
  Minimize2,
  Maximize2,
  Settings,
  Activity,
  BarChart3,
  Clock,
  Zap,
} from "lucide-react";
import { useFloatPanelStore } from "@/store/useFloatPanelStore";
import { useExtensionStore } from "@/store/useExtensionStore";

const FloatPanelApp: React.FC = () => {
  const { hide, size } = useFloatPanelStore();
  const { isActive, settings } = useExtensionStore();
  const [isMinimized, setIsMinimized] = useState(false);

  const handleMinimize = useCallback(() => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);

    // Send message to parent window (content script) to resize iframe
    const newHeight = newMinimizedState ? 40 : 300;
    const message = {
      type: "RESIZE_FLOAT_PANEL",
      height: newHeight,
    };

    window.parent.postMessage(message, "*");
  }, [isMinimized]);

  const handleClose = useCallback(() => {
    hide();
  }, [hide]);

  return (
    <div
      className={`w-full h-full flex flex-col ${
        isMinimized
          ? "bg-transparent border-none shadow-none"
          : "bg-white border border-gray-200 rounded-lg shadow-lg"
      }`}
      style={{
        width: size.width,
        height: isMinimized ? 40 : size.height,
        transition: "height 0.3s ease-in-out",
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 cursor-move ${
          isMinimized ? "bg-transparent" : "bg-gray-50 border-b border-gray-200"
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900">Float Panel</span>
          <div
            className={`w-2 h-2 rounded-full ${
              isActive ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMinimize();
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-3 h-3 text-gray-600" />
            ) : (
              <Minimize2 className="w-3 h-3 text-gray-600" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors"
          >
            <X className="w-3 h-3 text-gray-600 hover:text-red-600" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Content */}
          <div className="p-4 space-y-4 min-h-full">
            {/* Status Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Extension Status
                  </h3>
                  <p className="text-xs text-gray-600">
                    {isActive ? "Running and monitoring" : "Inactive"}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-gray-900">
                    Performance
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 mt-1">98%</p>
                <p className="text-xs text-gray-500">Efficiency</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-900">
                    Uptime
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 mt-1">24h</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>

            {/* Settings Preview */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Current Settings
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Theme:</span>
                  <span className="capitalize font-medium">
                    {settings.theme}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Auto Open:</span>
                  <span className="font-medium">
                    {settings.autoOpen ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button className="w-full btn btn-primary py-2 text-sm">
                Quick Action
              </button>
              <button className="w-full btn btn-secondary py-2 text-sm">
                Open Settings
              </button>
            </div>

            {/* Additional content to test scrolling */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Recent Activity
              </h4>
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  • Extension activated
                </div>
                <div className="text-xs text-gray-600">• Panel opened</div>
                <div className="text-xs text-gray-600">• Settings updated</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Quick Stats
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-gray-600">Sessions: 12</div>
                <div className="text-gray-600">Duration: 2h 30m</div>
                <div className="text-gray-600">Efficiency: 98%</div>
                <div className="text-gray-600">Errors: 0</div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                System Status
              </h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div>✓ All systems operational</div>
                <div>✓ Memory usage: 45MB</div>
                <div>✓ CPU usage: 2%</div>
                <div>✓ Network: Connected</div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Notifications
              </h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div>• Update available</div>
                <div>• New feature released</div>
                <div>• Performance optimized</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatPanelApp;
