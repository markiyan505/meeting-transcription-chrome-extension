import React from "react";
import { Zap, Eye, EyeOff, AlertCircle } from "lucide-react";

interface HeaderProps {
  isActive: boolean;
  onToggle: () => void;
  statusMessage?: string;
  isSupported: boolean;
}

const Header: React.FC<HeaderProps> = ({ isActive, onToggle, statusMessage, isSupported }) => {
  const statusColor = isActive ? "text-green-500" : "text-muted-foreground";
  const statusText = isActive ? "Active" : "Inactive";
  
  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-base font-semibold text-foreground">Caption Recorder</h1>
        </div>
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
          <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
          {!isSupported && (
            <div className="flex items-center space-x-1 text-amber-500">
              <AlertCircle className="w-3 h-3" />
              <span className="text-xs">Unsupported site</span>
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground">v1.0.0</span>
      </div>
      {statusMessage && (
        <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <p className="text-xs text-amber-500">{statusMessage}</p>
        </div>
      )}
    </div>
  );
};

export default Header;