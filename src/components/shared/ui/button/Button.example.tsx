import React from "react";
import { Button } from "./Button";

// Приклад використання покращеного Button компонента з вбудованим tooltip
export const ButtonExamples: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-6">Button Examples</h2>

      {/* Basic Variants */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Basic Variants</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>
      </section>

      {/* With Icons */}
      <section>
        <h3 className="text-lg font-semibold mb-4">With Icons</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            leftIcon={<span>📁</span>}
            variant="primary"
            tooltip="Open a file"
          >
            Open File
          </Button>
          <Button
            rightIcon={<span>→</span>}
            variant="outline"
            tooltip="Go to next page"
          >
            Next
          </Button>
          <Button
            leftIcon={<span>💾</span>}
            rightIcon={<span>✓</span>}
            variant="success"
            tooltip="Save all changes"
          >
            Save Changes
          </Button>
        </div>
      </section>

      {/* Loading States */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Loading States</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            loading
            variant="primary"
            tooltip="This tooltip won't show during loading"
          >
            Loading...
          </Button>
          <Button
            loading
            loadingText="Saving..."
            variant="success"
            tooltip="This tooltip won't show during loading"
          >
            Save
          </Button>
          <Button
            loading
            variant="danger"
            disabled
            tooltip="This tooltip won't show when disabled"
          >
            Delete
          </Button>
        </div>
      </section>

      {/* With Built-in Tooltips */}
      <section>
        <h3 className="text-lg font-semibold mb-4">With Built-in Tooltips</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="primary"
            tooltip="This is a tooltip on top"
            tooltipPosition="top"
          >
            Top Tooltip
          </Button>

          <Button
            variant="secondary"
            tooltip="This is a tooltip on the right"
            tooltipPosition="right"
          >
            Right Tooltip
          </Button>

          <Button
            variant="outline"
            tooltip="This is a tooltip on the bottom"
            tooltipPosition="bottom"
          >
            Bottom Tooltip
          </Button>

          <Button
            variant="ghost"
            tooltip="This is a tooltip on the left"
            tooltipPosition="left"
          >
            Left Tooltip
          </Button>
        </div>
      </section>


      

      {/* Tooltip States */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Tooltip States</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" tooltip="Normal tooltip">
            Normal
          </Button>

          <Button
            variant="secondary"
            disabled
            tooltip="This tooltip won't show when disabled"
          >
            Disabled
          </Button>

          <Button
            variant="success"
            loading
            tooltip="This tooltip won't show during loading"
          >
            Loading
          </Button>

          <Button variant="warning" tooltip="">
            No Tooltip
          </Button>
        </div>
      </section>
    </div>
  );
};
