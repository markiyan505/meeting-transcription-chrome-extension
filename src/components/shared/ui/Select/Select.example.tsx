import React, { useState } from "react";
import { Select } from "./Select";
import { DropdownSelect } from "../DropdownSelect/DropdownSelect";

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

export const SelectExample: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSize, setSelectedSize] = useState("default");
  const [selectedVariant, setSelectedVariant] = useState("default");
  const [selectedDisabled, setSelectedDisabled] = useState("all");
  const [selectedError, setSelectedError] = useState("all");

  // DropdownSelect states
  const [dropdownPlatform, setDropdownPlatform] = useState("");
  const [dropdownStatus, setDropdownStatus] = useState("");
  const [dropdownSize, setDropdownSize] = useState("default");
  const [dropdownVariant, setDropdownVariant] = useState("default");
  const [dropdownDisabled, setDropdownDisabled] = useState("");
  const [dropdownError, setDropdownError] = useState("");

  return (
    <div className="p-6 space-y-8 bg-background">
      <div>
        <h2 className="text-2xl font-bold mb-4">Select Component Examples</h2>
        <p className="text-muted-foreground mb-6">
          A simple and clean select component with various sizes and variants.
        </p>
      </div>

      {/* Basic Usage */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Platform Filter
            </label>
            <Select
              options={platformOptions}
              value={selectedPlatform}
              onChange={setSelectedPlatform}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Status Filter
            </label>
            <Select
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
            />
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sizes</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Small</label>
            <Select
              options={platformOptions}
              value={selectedSize}
              onChange={setSelectedSize}
              size="sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Default</label>
            <Select
              options={platformOptions}
              value={selectedSize}
              onChange={setSelectedSize}
              size="default"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Large</label>
            <Select
              options={platformOptions}
              value={selectedSize}
              onChange={setSelectedSize}
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Variants</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Default</label>
            <Select
              options={platformOptions}
              value={selectedVariant}
              onChange={setSelectedVariant}
              variant="default"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Outline</label>
            <Select
              options={platformOptions}
              value={selectedVariant}
              onChange={setSelectedVariant}
              variant="outline"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filled</label>
            <Select
              options={platformOptions}
              value={selectedVariant}
              onChange={setSelectedVariant}
              variant="filled"
            />
          </div>
        </div>
      </div>

      {/* States */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">States</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Disabled</label>
            <Select
              options={platformOptions}
              value={selectedDisabled}
              onChange={setSelectedDisabled}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Error State
            </label>
            <Select
              options={platformOptions}
              value={selectedError}
              onChange={setSelectedError}
              error
              helperText="Please select a valid option"
            />
          </div>
        </div>
      </div>

      {/* With Helper Text */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">With Helper Text</h3>
        <div>
          <label className="block text-sm font-medium mb-2">
            Select with helper text
          </label>
          <Select
            options={platformOptions}
            value={selectedPlatform}
            onChange={setSelectedPlatform}
            helperText="Choose the platform you want to filter by"
          />
        </div>
      </div>

      {/* Real-world Example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Real-world Example</h3>
        <div className="p-4 border border-border rounded-lg bg-card">
          <div className="flex space-x-2">
            <Select
              options={platformOptions}
              value={selectedPlatform}
              onChange={setSelectedPlatform}
              size="sm"
              variant="outline"
              className="flex-1"
            />
            <Select
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              size="sm"
              variant="outline"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* DropdownSelect Examples */}
      <div className="space-y-8 border-t border-border pt-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Custom Dropdown Select Examples
          </h2>
          <p className="text-muted-foreground mb-6">
            A custom dropdown select component with enhanced styling,
            animations, and better UX.
          </p>
        </div>

        {/* Basic DropdownSelect Usage */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic DropdownSelect Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Platform Filter (Dropdown)
              </label>
              <DropdownSelect
                options={platformOptions}
                value={dropdownPlatform}
                onChange={setDropdownPlatform}
                placeholder="Select platform..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Status Filter (Dropdown)
              </label>
              <DropdownSelect
                options={statusOptions}
                value={dropdownStatus}
                onChange={setDropdownStatus}
                placeholder="Select status..."
              />
            </div>
          </div>
        </div>

        {/* DropdownSelect Sizes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">DropdownSelect Sizes</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Small</label>
              <DropdownSelect
                options={platformOptions}
                value={dropdownSize}
                onChange={setDropdownSize}
                size="sm"
                placeholder="Small dropdown..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Default</label>
              <DropdownSelect
                options={platformOptions}
                value={dropdownSize}
                onChange={setDropdownSize}
                size="default"
                placeholder="Default dropdown..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Large</label>
              <DropdownSelect
                options={platformOptions}
                value={dropdownSize}
                onChange={setDropdownSize}
                size="lg"
                placeholder="Large dropdown..."
              />
            </div>
          </div>
        </div>

        {/* DropdownSelect Variants */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">DropdownSelect Variants</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default</label>
              <DropdownSelect
                options={platformOptions}
                value={dropdownVariant}
                onChange={setDropdownVariant}
                variant="default"
                placeholder="Default variant..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Outline</label>
              <DropdownSelect
                options={platformOptions}
                value={dropdownVariant}
                onChange={setDropdownVariant}
                variant="outline"
                placeholder="Outline variant..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filled</label>
              <DropdownSelect
                options={platformOptions}
                value={dropdownVariant}
                onChange={setDropdownVariant}
                variant="filled"
                placeholder="Filled variant..."
              />
            </div>
          </div>
        </div>

        {/* DropdownSelect States */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">DropdownSelect States</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Disabled</label>
              <DropdownSelect
                options={platformOptions}
                value={dropdownDisabled}
                onChange={setDropdownDisabled}
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
                value={dropdownError}
                onChange={setDropdownError}
                error
                helperText="Please select a valid option"
                placeholder="Error state dropdown..."
              />
            </div>
          </div>
        </div>

        {/* DropdownSelect with Helper Text */}
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
              value={dropdownPlatform}
              onChange={setDropdownPlatform}
              helperText="Choose the platform you want to filter by"
              placeholder="Select platform..."
            />
          </div>
        </div>

        {/* DropdownSelect Real-world Example */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            DropdownSelect Real-world Example
          </h3>
          <div className="p-4 border border-border rounded-lg bg-card">
            <div className="flex space-x-2">
              <DropdownSelect
                options={platformOptions}
                value={dropdownPlatform}
                onChange={setDropdownPlatform}
                size="sm"
                variant="outline"
                className="flex-1"
                placeholder="Platform..."
              />
              <DropdownSelect
                options={statusOptions}
                value={dropdownStatus}
                onChange={setDropdownStatus}
                size="sm"
                variant="outline"
                className="flex-1"
                placeholder="Status..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
