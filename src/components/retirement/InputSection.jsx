import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Wallet, PiggyBank } from "lucide-react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export function InputSection({ inputs, updateInput, onCalculate, title = "Retirement Planner", isComparison = false }) {
  const handleMonthlyInvestmentChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    const numValue = Math.min(Math.max(parseInt(value) || 1000, 1000), 100000);
    updateInput("monthlyInvestment", numValue);
  };

  return (
    <div className={`glass rounded-2xl p-6 space-y-6 ${isComparison ? "border-accent/30" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary">
          <Calculator className="w-5 h-5 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>

      <div className="space-y-5">
        {/* Current Age */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-muted-foreground">Current Age</Label>
            <span className="text-lg font-semibold text-foreground">{inputs.currentAge} years</span>
          </div>
          <Slider
            value={[inputs.currentAge]}
            onValueChange={([value]) => updateInput("currentAge", value)}
            min={18}
            max={60}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>18</span>
            <span>60</span>
          </div>
        </div>

        {/* Retirement Age */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-muted-foreground">Retirement Age</Label>
            <span className="text-lg font-semibold text-foreground">{inputs.retirementAge} years</span>
          </div>
          <Slider
            value={[inputs.retirementAge]}
            onValueChange={([value]) => updateInput("retirementAge", value)}
            min={45}
            max={75}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>45</span>
            <span>75</span>
          </div>
          <p className="text-xs text-accent font-medium">
            {inputs.retirementAge - inputs.currentAge} years until retirement
          </p>
        </div>

        {/* Monthly Investment */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Monthly Investment</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
            <Input
              type="text"
              value={inputs.monthlyInvestment.toLocaleString("en-IN")}
              onChange={handleMonthlyInvestmentChange}
              className="pl-8 text-lg font-semibold h-12 bg-secondary"
            />
          </div>
          <p className="text-xs text-muted-foreground">₹1,000 - ₹1,00,000</p>
        </div>

        {/* Expected Return */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-muted-foreground">Expected Return (p.a.)</Label>
            <span className="text-lg font-semibold text-accent">{inputs.expectedReturn}%</span>
          </div>
          <Slider
            value={[inputs.expectedReturn]}
            onValueChange={([value]) => updateInput("expectedReturn", value)}
            min={7}
            max={15}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>7%</span>
            <span>15%</span>
          </div>
        </div>

        {/* Inflation Rate */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-muted-foreground">Assumed Inflation</Label>
            <span className="text-lg font-semibold text-destructive">{inputs.inflation}%</span>
          </div>
          <Slider
            value={[inputs.inflation]}
            onValueChange={([value]) => updateInput("inflation", value)}
            min={4}
            max={8}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>4%</span>
            <span>8%</span>
          </div>
        </div>

        {/* Investment Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Investment Type</Label>
          <Tabs value={inputs.investmentType} onValueChange={(value) => updateInput("investmentType", value)}>
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger value="sip" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TrendingUp className="w-4 h-4" />
                SIP
              </TabsTrigger>
              <TabsTrigger value="rd" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Wallet className="w-4 h-4" />
                RD
              </TabsTrigger>
              <TabsTrigger value="fd" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <PiggyBank className="w-4 h-4" />
                FD
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            {inputs.investmentType === "sip" && "Monthly compounding (Mutual Fund SIP)"}
            {inputs.investmentType === "rd" && "Quarterly compounding (Recurring Deposit)"}
            {inputs.investmentType === "fd" && "Annual compounding (Fixed Deposit - Lump Sum)"}
          </p>
        </div>

        <Button 
          onClick={onCalculate} 
          className="w-full h-12 text-lg font-semibold"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calculate
        </Button>
      </div>
    </div>
  );
}
