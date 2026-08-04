import { Input } from "./input";
import { Label } from "./label";

export function ColorField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-sunken p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 font-mono uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}
