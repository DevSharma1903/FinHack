import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { translateNode, useI18n } from "@/i18n/i18n";

const buildEducationContent = (t) => [
  {
    title: "SIP vs RD vs FD",
    emoji: "",
    content: (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/20">
                <th className="border p-3 text-left">{translateNode("Feature", t)}</th>
                <th className="border p-3 text-left">{translateNode("SIP", t)}</th>
                <th className="border p-3 text-left">{translateNode("RD", t)}</th>
                <th className="border p-3 text-left">{translateNode("FD", t)}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Investment type", "Market-linked", "Bank deposit", "Bank deposit"],
                ["Risk", "Medium–High", "Low", "Very Low"],
                ["Returns", "Highest (long term)", "Medium", "Low"],
                ["Compounding", "Yes (strong)", "Limited", "Limited"],
                ["Best for", "Long-term goals", "Short-term savings", "Capital protection"]
              ].map(([feature, sip, rd, fd], index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-muted/5" : ""}>
                  <td className="border p-3 font-medium">{translateNode(feature, t)}</td>
                  <td className="border p-3">{translateNode(sip, t)}</td>
                  <td className="border p-3">{translateNode(rd, t)}</td>
                  <td className="border p-3">{translateNode(fd, t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 mt-6">
          <div className="p-4 bg-muted/20 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">{translateNode("FD > RD in returns if:", t)}</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>{translateNode("Interest rate is the same", t)}</li>
              <li>{translateNode("Total invested amount is the same", t)}</li>
            </ul>
          </div>

          <div className="p-4 bg-muted/20 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">{translateNode("RD is better if:", t)}</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>{translateNode("You don't have a lump sum", t)}</li>
              <li>{translateNode("You want disciplined monthly savings", t)}</li>

            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "How Your Returns Are Taxed Fixed Deposit (FD) & Recurring Deposit (RD)",
    emoji: "",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>{translateNode("Interest earned is fully taxable as normal income.", t)}</li>
          <li>{translateNode("Tax is charged as per your income slab (up to 30% + cess).", t)}</li>
          <li>{translateNode("TDS applies if yearly interest exceeds:", t)}</li>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>{translateNode("₹50,000 (₹1 lakh for senior citizens)", t)}</li>
          </ul>
          <li>{translateNode("Even if the bank pays 6.5%, your real return may drop to ~4.5% after tax.", t)}</li>
        </ul>
      </div>
    )
  },
  {
    title: "SIP in Mutual Funds",
    emoji: "",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-1">{translateNode("Equity Mutual Funds (more than 65% in shares):", t)}</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>{translateNode("Short-term (< 1 year): 20% tax on gains", t)}</li>
            <li>{translateNode("Long-term (> 1 year): 12.5% tax only if gains exceed ₹1.25 lakh/year", t)}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-1">{translateNode("Debt Mutual Funds:", t)}</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>{translateNode("Gains taxed like FD interest (as per slab rate)", t)}</li>
            <li>{translateNode("No indexation benefit", t)}</li>
            <li>{translateNode("Equity SIPs are generally more tax-efficient for long-term goals.", t)}</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Tax Saving Under Section 80C (Most Popular)",
    emoji: "",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          {translateNode("You can deduct up to ₹1.5 lakh per year from your taxable income.", t)}
        </p>
        <div>
          <h4 className="font-medium mb-1">{translateNode("Eligible investments include:", t)}</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>{translateNode("ELSS Mutual Funds (3-year lock-in, SIP allowed)", t)}</li>
            <li>{translateNode("5-year Tax-saving FDs", t)}</li>
            <li>{translateNode("Life insurance & pension premiums", t)}</li>
          </ul>
        </div>
        <p className="text-muted-foreground">
          {translateNode("If you're in the 30% tax bracket, investing ₹1.5 lakh here can save you ₹46,800 in tax every year.", t)}
        </p>
      </div>
    )
  },
  {
    title: "RBI Monetary Policy (Why FD/RD Rates Change)",
    emoji: "",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>{translateNode("RBI controls interest rates using the repo rate", t)}</li>
          <li>{translateNode("As of 2025, repo rate is around 5.25%", t)}</li>
          <li>{translateNode("Lower repo rate means Lower FD/RD interest", t)}</li>
        </ul>
        <div className="mt-4">
          <h4 className="font-medium mb-1">{translateNode("Current FD/RD rates:", t)}</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>{translateNode("Major banks: ~6% to 6.6%", t)}</li>
            <li>{translateNode("FD/RD returns depend heavily on RBI decisions — you don't control them.", t)}</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Insurance & Retirement-Oriented Policies",
    emoji: "",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          {translateNode("Life insurance & pension plans qualify for tax benefits. These products provide:", t)}
        </p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>{translateNode("Financial protection", t)}</li>
          <li>{translateNode("Guaranteed or stable retirement income", t)}</li>
          <li>{translateNode("Some annuity and pension plans allow tax deferral or partial tax-free maturity", t)}</li>
        </ul>
        <p className="text-muted-foreground">
          {translateNode("Best used alongside SIP/FD/RD, not as replacements.", t)}
        </p>
      </div>
    )
  },
  {
    title: "Important Sections (Quick Guide)",
    emoji: "",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-1">{translateNode("Section 80C:", t)}</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>{translateNode("Tax deduction up to ₹1.5 lakh/year", t)}</li>
            <li>{translateNode("Saves up to ₹46,800 in tax", t)}</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-1">{translateNode("Section 80CCC:", t)}</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>{translateNode("Deduction for pension plans (like annuity plans)", t)}</li>
            <li>{translateNode("Included within the ₹1.5 lakh 80C limit", t)}</li>
            <li>{translateNode("Tax benefit during investment; pension income is usually taxable later", t)}</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-1">{translateNode("Section 80D:", t)}</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>{translateNode("Deduction for health insurance premiums", t)}</li>
            <li>{translateNode("Limits:", t)}</li>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>{translateNode("₹25,000 (self + family)", t)}</li>
              <li>{translateNode("₹50,000 (senior citizens)", t)}</li>
            </ul>
            <li>{translateNode("Separate from 80C — extra tax saving!", t)}</li>
            <li>{translateNode("Encourages financial safety + medical protection.", t)}</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Simple Takeaway",
    emoji: "★",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li><span className="font-medium">{translateNode("FD/RD", t)} = {translateNode("Safe, but taxed heavily", t)}</span></li>
          <li><span className="font-medium">{translateNode("SIP (Equity)", t)} = {translateNode("Better long-term growth + lower tax", t)}</span></li>
          <li><span className="font-medium">{translateNode("80C + 80D", t)} = {translateNode("Reduce tax and grow wealth", t)}</span></li>
          <li><span className="font-medium">{translateNode("RBI rates", t)} = {translateNode("decide how attractive FDs really are", t)}</span></li>
        </ul>
      </div>
    )
  }
];

export const EducationSection = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">{t("Investment Education Hub")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              {t("Learn how different investment options are taxed and how to optimize your returns.")}
              {" "}
              {t("Click on each section to expand and learn more.")}
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {buildEducationContent(t).map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-lg overflow-hidden hover:bg-muted/30 transition-colors duration-200"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-left font-medium">{t(item.title)}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 bg-muted/20">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-6 p-4 bg-secondary rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="font-medium mb-2">{t("Key Insight")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("Understanding how your investments are taxed can help you make better financial decisions and keep more of your returns.")}
                  {" "}
                  {t("Always consider both pre-tax and post-tax returns when comparing investment options.")}
                </p>
              </div>
            </div>
          </div>
      </CardContent>
      </Card>
    </div>
  );
};
