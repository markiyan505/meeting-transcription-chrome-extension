import React, { useState } from "react";
import { Toggle } from "./Toggle";

// Приклад використання Toggle компонента
export const ToggleExamples: React.FC = () => {
  const [basicToggle, setBasicToggle] = useState(false);
  const [darkToggle, setDarkToggle] = useState(true);
  const [lightToggle, setLightToggle] = useState(false);

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-6">Toggle Examples</h2>

      {/* Basic Variants */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Basic Variants</h3>
        <div className="flex flex-wrap gap-6">
          <Toggle
            checked={basicToggle}
            onChange={setBasicToggle}
            label="Default Toggle"
          />

          <Toggle
            checked={darkToggle}
            onChange={setDarkToggle}
            variant="dark"
            label="Dark Toggle"
          />

          <Toggle
            checked={lightToggle}
            onChange={setLightToggle}
            variant="light"
            label="Light Toggle"
          />
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Sizes</h3>
        <div className="flex flex-wrap items-center gap-6">
          <Toggle
            size="sm"
            variant="light"
            label="Small (Light)"
            description="Dark circle on light background"
          />

          <Toggle
            size="default"
            variant="light"
            label="Default (Light)"
            description="Dark circle on light background"
          />

          <Toggle
            size="lg"
            variant="light"
            label="Large (Light)"
            description="Dark circle on light background"
          />
        </div>
      </section>

      {/* Dark Background Examples */}
      <section className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Dark Background Examples
        </h3>
        <div className="flex flex-wrap gap-6">
          <Toggle
            variant="default"
            checked={true}
            label="Toggle On (Dark Background)"
            description="Light circle on dark background when on"
          />

          <Toggle
            variant="dark"
            checked={false}
            label="Toggle Off (Dark Background)"
            description="Light circle on light background when off"
          />

          <Toggle
            variant="light"
            checked={true}
            label="Dark Variant (On)"
            description="Same styling as default"
          />
        </div>
      </section>

      {/* Real-world Examples */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Real-world Examples</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Enable Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receive push notifications for updates
              </p>
            </div>
            <Toggle checked={basicToggle} onChange={setBasicToggle} size="lg" />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Dark Mode</h4>
              <p className="text-sm text-muted-foreground">
                Switch to dark theme
              </p>
            </div>
            <Toggle
              checked={darkToggle}
              onChange={setDarkToggle}
              variant="dark"
              size="lg"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Auto-save</h4>
              <p className="text-sm text-muted-foreground">
                Automatically save changes
              </p>
            </div>
            <Toggle
              checked={lightToggle}
              onChange={setLightToggle}
              variant="light"
              size="lg"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
