import React, { useState } from "react";
import { DropdownSelect } from "./DropdownSelect";

const platformOptions = [
  { value: "all", label: "All platforms" },
  { value: "google-meet", label: "Google Meet" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "zoom", label: "Zoom" },
];

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "synced", label: "Synced" },
  { value: "unsynced", label: "Not synced" },
];

const sizeOptions = [
  { value: "sm", label: "Small" },
  { value: "default", label: "Default" },
  { value: "lg", label: "Large" },
];

const variantOptions = [
  { value: "default", label: "Default" },
  { value: "outline", label: "Outline" },
  { value: "filled", label: "Filled" },
];

export const DropdownSelectExample: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSize, setSelectedSize] = useState("default");
  const [selectedVariant, setSelectedVariant] = useState("default");
  const [selectedDisabled, setSelectedDisabled] = useState("");
  const [selectedError, setSelectedError] = useState("");

  return (
    <div className="p-6 space-y-8 bg-background">
      <div>
        <h2 className="text-2xl font-bold mb-4">
          DropdownSelect Component Examples
        </h2>
        <p className="text-muted-foreground mb-6">
          A custom dropdown select component with enhanced styling, animations,
          and better UX.
        </p>
      </div>

      {/* Basic Usage */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic DropdownSelect Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Platform Filter (Dropdown)
            </label>
            <DropdownSelect
              options={platformOptions}
              value={selectedPlatform}
              onChange={setSelectedPlatform}
              placeholder="Select platform..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Status Filter (Dropdown)
            </label>
            <DropdownSelect
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Select status..."
            />
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">DropdownSelect Sizes</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Small</label>
            <DropdownSelect
              options={platformOptions}
              value={selectedSize}
              onChange={setSelectedSize}
              size="sm"
              placeholder="Small dropdown..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Default</label>
            <DropdownSelect
              options={platformOptions}
              value={selectedSize}
              onChange={setSelectedSize}
              size="default"
              placeholder="Default dropdown..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Large</label>
            <DropdownSelect
              options={platformOptions}
              value={selectedSize}
              onChange={setSelectedSize}
              size="lg"
              placeholder="Large dropdown..."
            />
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">DropdownSelect Variants</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Default</label>
            <DropdownSelect
              options={platformOptions}
              value={selectedVariant}
              onChange={setSelectedVariant}
              variant="default"
              placeholder="Default variant..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Outline</label>
            <DropdownSelect
              options={platformOptions}
              value={selectedVariant}
              onChange={setSelectedVariant}
              variant="outline"
              placeholder="Outline variant..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filled</label>
            <DropdownSelect
              options={platformOptions}
              value={selectedVariant}
              onChange={setSelectedVariant}
              variant="filled"
              placeholder="Filled variant..."
            />
          </div>
        </div>
      </div>

      {/* States */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">DropdownSelect States</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Disabled</label>
            <DropdownSelect
              options={platformOptions}
              value={selectedDisabled}
              onChange={setSelectedDisabled}
              disabled
              placeholder="Disabled dropdown..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Error State
            </label>
            <DropdownSelect
              options={platformOptions}
              value={selectedError}
              onChange={setSelectedError}
              error
              helperText="Please select a valid option"
              placeholder="Error state dropdown..."
            />
          </div>
        </div>
      </div>

      {/* With Helper Text */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          DropdownSelect with Helper Text
        </h3>
        <div>
          <label className="block text-sm font-medium mb-2">
            DropdownSelect with helper text
          </label>
          <DropdownSelect
            options={platformOptions}
            value={selectedPlatform}
            onChange={setSelectedPlatform}
            helperText="Choose the platform you want to filter by"
            placeholder="Select platform..."
          />
        </div>
      </div>

      {/* Real-world Example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          DropdownSelect Real-world Example
        </h3>
        <div className="p-4 border border-border rounded-lg bg-card">
          <div className="flex space-x-2">
            <DropdownSelect
              options={platformOptions}
              value={selectedPlatform}
              onChange={setSelectedPlatform}
              size="sm"
              variant="outline"
              className="flex-1"
              placeholder="Platform..."
            />
            <DropdownSelect
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              size="sm"
              variant="outline"
              className="flex-1"
              placeholder="Status..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
