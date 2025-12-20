import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GitCompare } from "lucide-react";

export function ComparisonToggle({ showComparison, setShowComparison }) {
  return (
    <div className="glass rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-accent/10">
          <GitCompare className="w-5 h-5 text-accent" />
        </div>
        <div>
          <Label className="text-sm font-medium text-foreground">Comparison Mode</Label>
          <p className="text-xs text-muted-foreground">Compare two investment scenarios</p>
        </div>
      </div>
      <Switch
        checked={showComparison}
        onCheckedChange={setShowComparison}
        className="data-[state=checked]:bg-accent"
      />
    </div>
  );
}
