import React from "react";
import MeetControlPanel from "@/components/features/meet-control-panel/MeetControlPanel";

const MeetPanelDemo: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Meet Control Panel Demo
        </h1>

        {/* Demo Panel */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Control Panel
          </h2>
          <div className="flex justify-center">
            <MeetControlPanel />
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">About This Demo</h3>
          <div className="text-gray-600 space-y-2">
            <p>
              This is a demo of the MeetControlPanel component. The panel now
              manages its own internal state and provides the following
              functionality:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Start, pause, resume, and stop recording</li>
              <li>Toggle subtitles</li>
              <li>Handle authorization errors</li>
              <li>Handle subtitle and language errors</li>
              <li>Switch between vertical and horizontal orientations</li>
              <li>Collapse and expand the panel</li>
              <li>Drag handle for repositioning</li>
            </ul>
            <p className="mt-4">
              The component is now self-contained and doesn't require external
              state management. All interactions are handled internally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetPanelDemo;
