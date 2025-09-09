import React from "react";
import MeetControlPanel from "@/components/MeetControlPanel";
import FloatPanelSubtitles from "@/components/SubtitlesPanel/FloatPanelSubtitles";

const DevApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Extension Development Environment
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Meet Control Panel Demo */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Meet Control Panel
            </h2>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <MeetControlPanel />
            </div>
          </div>

          {/* Subtitles Panel Demo */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Subtitles Panel
            </h2>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 h-96">
              <FloatPanelSubtitles />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Development Instructions
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>• This is a development environment for testing components</li>
            <li>• Use the panels above to test functionality</li>
            <li>• Check browser console for any errors</li>
            <li>• Components are isolated and can be tested independently</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DevApp;
