import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GitCompare } from "lucide-react";

export function ComparisonToggle({ showComparison, setShowComparison }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-muted border border-border">
          <GitCompare className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <Label className="text-sm font-medium text-foreground">Comparison Mode</Label>
          <p className="text-xs text-muted-foreground">Compare two investment scenarios</p>
        </div>
      </div>
      <Switch
        checked={showComparison}
        onCheckedChange={setShowComparison}
        className="data-[state=checked]:bg-foreground"
      />
    </div>
  );
}
