import React, { useState } from "react";
import MeetControlPanel from "@/components/features/meet-control-panel/MeetControlPanel";
import FloatPanelSubtitles from "@/components/features/subtitles-panel/FloatPanelSubtitles";
import PopupApp from "@/components/features/popup-panel/PopupApp";
import { ButtonExamples } from "@/components/shared/ui/button/Button.example";
import { ToggleExamples } from "@/components/shared/ui/toggle/Toggle.example";
import { IconExamples } from "@/components/shared/ui/icon/Icon.example";
import { InputExamples } from "@/components/shared/ui/input/Input.example";
import { DropdownSelectExample } from "@/components/shared/ui/dropdown-select/DropdownSelect.example";

const DevApp: React.FC = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [showButtons, setShowButtons] = useState(false);
  const [showToggles, setShowToggles] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [showInputs, setShowInputs] = useState(false);
  const [showSelects, setShowSelects] = useState(false);
  const [showDropdownSelects, setShowDropdownSelects] = useState(false);
  const [popupSize, setPopupSize] = useState<"small" | "medium" | "large">(
    "medium"
  );
  const [popupTheme, setPopupTheme] = useState<"light" | "dark">("light");

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Extension Development Environment
          </h1>
          <div className="flex items-center gap-4">
            {showPopup && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Size:
                  </label>
                  <select
                    value={popupSize}
                    onChange={(e) =>
                      setPopupSize(
                        e.target.value as "small" | "medium" | "large"
                      )
                    }
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="small">Small (320x400)</option>
                    <option value="medium">Medium (400x550)</option>
                    <option value="large">Large (500x600)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Theme:
                  </label>
                  <select
                    value={popupTheme}
                    onChange={(e) =>
                      setPopupTheme(e.target.value as "light" | "dark")
                    }
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowIcons(!showIcons)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showIcons ? "Hide" : "Show"} Icons
              </button>
              <button
                onClick={() => setShowInputs(!showInputs)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showInputs ? "Hide" : "Show"} Inputs
              </button>
              <button
                onClick={() => setShowSelects(!showSelects)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showSelects ? "Hide" : "Show"} Selects
              </button>
              <button
                onClick={() => setShowDropdownSelects(!showDropdownSelects)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showDropdownSelects ? "Hide" : "Show"} DropdownSelects
              </button>
              <button
                onClick={() => setShowToggles(!showToggles)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showToggles ? "Hide" : "Show"} Toggles
              </button>
              <button
                onClick={() => setShowButtons(!showButtons)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showButtons ? "Hide" : "Show"} Buttons
              </button>
              <button
                onClick={() => setShowPopup(!showPopup)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showPopup ? "Hide" : "Show"} Popup
              </button>
            </div>
          </div>
        </div>

        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Meet Control Panel
            </h2>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <MeetControlPanel />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Subtitles Panel
            </h2>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 h-96">
              <FloatPanelSubtitles />
            </div>
          </div>
        </div> */}

        {/* Icon Examples */}
        {showIcons && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Icon Components Examples
            </h2>
            <IconExamples />
          </div>
        )}

        {/* Toggle Examples */}
        {showToggles && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Toggle Components Examples
            </h2>
            <ToggleExamples />
          </div>
        )}

        {/* Button Examples */}
        {showButtons && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Button Components Examples
            </h2>
            <ButtonExamples />
          </div>
        )}

        {/* Input Examples */}
        {showInputs && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <InputExamples />
          </div>
        )}

        {/* DropdownSelect Examples */}
        {showDropdownSelects && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              DropdownSelect Components Examples
            </h2>
            <DropdownSelectExample />
          </div>
        )}

        {/* Popup Demo */}
        {showPopup && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6 ">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Popup Extension -{" "}
              {popupSize.charAt(0).toUpperCase() + popupSize.slice(1)} Size
            </h2>
            <div
              className={`border border-gray-200 rounded-lg p-4 ${
                popupTheme === "dark" ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <div
                className={`mx-auto border-2 border-gray-200 rounded-lg ${
                  popupSize === "small"
                    ? "w-80 h-96"
                    : popupSize === "medium"
                    ? "w-[400px] h-[550px]"
                    : "w-[500px] h-[600px]"
                } ${popupTheme === "dark" ? "dark" : ""}`}
              >
                <PopupApp />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevApp;
