import * as React from "react";
import { Search, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Input } from "./Input";

export const InputExamples = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold mb-6">Input Component Examples</h2>

      {/* Basic Usage */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Basic Usage</h3>
        <div className="space-y-4">
          <Input placeholder="Enter text..." />
          <Input placeholder="With value" value="Some text" />
          <Input placeholder="Disabled" disabled />
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Sizes</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Small
            </label>
            <Input placeholder="Small input" size="sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Default
            </label>
            <Input placeholder="Default input" size="default" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Large
            </label>
            <Input placeholder="Large input" size="lg" />
          </div>
        </div>
      </section>

      {/* Variants */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Variants</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Default
            </label>
            <Input placeholder="Default variant" variant="default" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Outline
            </label>
            <Input placeholder="Outline variant" variant="outline" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Filled
            </label>
            <Input placeholder="Filled variant" variant="filled" />
          </div>
        </div>
      </section>

      {/* With Icons */}
      <section>
        <h3 className="text-lg font-semibold mb-4">With Icons</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Search Input
            </label>
            <Input placeholder="Search..." leftIcon={Search} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Email Input
            </label>
            <Input placeholder="Enter email" type="email" leftIcon={Mail} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Password Input
            </label>
            <Input
              placeholder="Enter password"
              type={showPassword ? "text" : "password"}
              leftIcon={Lock}
              rightIcon={showPassword ? EyeOff : Eye}
            />
          </div>
        </div>
      </section>

      {/* States */}
      <section>
        <h3 className="text-lg font-semibold mb-4">States</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Normal
            </label>
            <Input placeholder="Normal state" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Loading
            </label>
            <Input placeholder="Loading state" loading />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Error
            </label>
            <Input
              placeholder="Error state"
              error
              helperText="This field is required"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              With Helper Text
            </label>
            <Input
              placeholder="With helper text"
              helperText="This is helpful information"
            />
          </div>
        </div>
      </section>

      {/* Real-world Examples */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Real-world Examples</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Login Form
            </h4>
            <div className="space-y-3 max-w-sm">
              <Input
                placeholder="Email"
                type="email"
                leftIcon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                leftIcon={Lock}
                rightIcon={showPassword ? EyeOff : Eye}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Search Form
            </h4>
            <div className="max-w-sm">
              <Input
                placeholder="Search records..."
                leftIcon={Search}
                variant="outline"
              />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Profile Form
            </h4>
            <div className="space-y-3 max-w-sm">
              <Input placeholder="Full name" leftIcon={User} />
              <Input
                placeholder="Username"
                leftIcon={User}
                helperText="Choose a unique username"
              />
              <Input
                placeholder="Email"
                type="email"
                leftIcon={Mail}
                error
                helperText="Please enter a valid email address"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
