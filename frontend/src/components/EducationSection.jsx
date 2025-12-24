import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const educationContent = [
  {
    title: "SIP vs RD vs FD",
    emoji: "📊",
    content: (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/20">
                <th className="border p-3 text-left">Feature</th>
                <th className="border p-3 text-left">SIP</th>
                <th className="border p-3 text-left">RD</th>
                <th className="border p-3 text-left">FD</th>
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
                  <td className="border p-3 font-medium">{feature}</td>
                  <td className="border p-3">{sip}</td>
                  <td className="border p-3">{rd}</td>
                  <td className="border p-3">{fd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 mt-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">FD &gt; RD in returns if:</h4>
            <ul className="list-disc pl-5 space-y-1 text-amber-700 dark:text-amber-300">
              <li>Interest rate is the same</li>
              <li>Total invested amount is the same</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">RD is better if:</h4>
            <ul className="list-disc pl-5 space-y-1 text-blue-700 dark:text-blue-300">
              <li>You don't have a lump sum</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "How Your Returns Are Taxed Fixed Deposit (FD) & Recurring Deposit (RD)",
    emoji: "🏦",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>Interest earned is fully taxable as normal income.</li>
          <li>Tax is charged as per your income slab (up to 30% + cess).</li>
          <li>TDS applies if yearly interest exceeds:</li>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>₹50,000 (₹1 lakh for senior citizens)</li>
          </ul>
          <li>Even if the bank pays 6.5%, your real return may drop to ~4.5% after tax.</li>
        </ul>
      </div>
    )
  },
  {
    title: "SIP in Mutual Funds",
    emoji: "📈",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-1">Equity Mutual Funds (more than 65% in shares):</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Short-term (&lt; 1 year): 20% tax on gains</li>
            <li>Long-term (&gt; 1 year): 12.5% tax only if gains exceed ₹1.25 lakh/year</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-1">Debt Mutual Funds:</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Gains taxed like FD interest (as per slab rate)</li>
            <li>No indexation benefit</li>
            <li>Equity SIPs are generally more tax-efficient for long-term goals.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Tax Saving Under Section 80C (Most Popular)",
    emoji: "💰",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          You can deduct up to ₹1.5 lakh per year from your taxable income.
        </p>
        <div>
          <h4 className="font-medium mb-1">Eligible investments include:</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>ELSS Mutual Funds (3-year lock-in, SIP allowed)</li>
            <li>5-year Tax-saving FDs</li>
            <li>Life insurance & pension premiums</li>
          </ul>
        </div>
        <p className="text-muted-foreground">
          If you're in the 30% tax bracket, investing ₹1.5 lakh here can save you ₹46,800 in tax every year.
        </p>
      </div>
    )
  },
  {
    title: "RBI Monetary Policy (Why FD/RD Rates Change)",
    emoji: "🏛️",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>RBI controls interest rates using the repo rate</li>
          <li>As of 2025, repo rate is around 5.25%</li>
          <li>Lower repo rate means Lower FD/RD interest</li>
        </ul>
        <div className="mt-4">
          <h4 className="font-medium mb-1">Current FD/RD rates:</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Major banks: ~6% to 6.6%</li>
            <li>FD/RD returns depend heavily on RBI decisions — you don't control them.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Insurance & Retirement-Oriented Policies",
    emoji: "🛡️",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Life insurance & pension plans qualify for tax benefits. These products provide:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Financial protection</li>
          <li>Guaranteed or stable retirement income</li>
          <li>Some annuity and pension plans allow tax deferral or partial tax-free maturity</li>
        </ul>
        <p className="text-muted-foreground">
          Best used alongside SIP/FD/RD, not as replacements.
        </p>
      </div>
    )
  },
  {
    title: "Important Sections (Quick Guide)",
    emoji: "📋",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-1">Section 80C:</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Tax deduction up to ₹1.5 lakh/year</li>
            <li>Saves up to ₹46,800 in tax</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-1">Section 80CCC:</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Deduction for pension plans (like annuity plans)</li>
            <li>Included within the ₹1.5 lakh 80C limit</li>
            <li>Tax benefit during investment; pension income is usually taxable later</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-1">Section 80D:</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Deduction for health insurance premiums</li>
            <li>Limits:</li>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>₹25,000 (self + family)</li>
              <li>₹50,000 (senior citizens)</li>
            </ul>
            <li>Separate from 80C — extra tax saving!</li>
            <li>Encourages financial safety + medical protection.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Simple Takeaway",
    emoji: "✨",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li><span className="font-medium">FD/RD</span> = Safe, but taxed heavily</li>
          <li><span className="font-medium">SIP (Equity)</span> = Better long-term growth + lower tax</li>
          <li><span className="font-medium">80C + 80D</span> = Reduce tax and grow wealth</li>
          <li><span className="font-medium">RBI rates</span> decide how attractive FDs really are</li>
        </ul>
      </div>
    )
  }
];

export const EducationSection = () => {
  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <span className="text-3xl">📚</span>
            Investment Education Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Learn how different investment options are taxed and how to optimize your returns.
              Click on each section to expand and learn more.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {educationContent.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border rounded-lg overflow-hidden hover:bg-muted/5 transition-colors"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-left font-medium">{item.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 bg-muted/5">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-1">�</div>
              <div>
                <h3 className="font-medium mb-2">Key Insight</h3>
                <p className="text-sm text-muted-foreground">
                  Understanding how your investments are taxed can help you make better financial decisions and keep more of your returns.
                  Always consider both pre-tax and post-tax returns when comparing investment options.
                </p>
              </div>
            </div>
          </div>
      </CardContent>
      </Card>
    </div>
  );
};
