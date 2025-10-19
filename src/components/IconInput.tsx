import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface IconInputProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  showPasswordToggle?: boolean;
}

export const IconInput: React.FC<IconInputProps> = ({
  id,
  label,
  icon,
  type = "text",
  placeholder = "",
  value,
  onChange,
  required = false,
  showPasswordToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">{label}</Label>
      <div className="relative">
        {/* Icon nhỏ, opacity 60% */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-60 w-4 h-4 flex items-center justify-center">
          {icon}
        </div>

        <Input
          id={id}
          type={isPassword && showPassword ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`h-12 border-2 pl-10 pr-${showPasswordToggle && isPassword ? "10" : "2"} text-base`}
        />

        {showPasswordToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  );
};
