import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useI18n } from "@/i18n/i18n";

const PolicySection = () => {
  const { t } = useI18n();

  const policyContent = [
    {
      title: "Latest Policy Updates",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <h4 className="font-medium text-blue-300">RSS Feed Integration Coming Soon</h4>
            </div>
            <p className="text-sm text-blue-200/80">
              Stay tuned for real-time policy updates and regulatory announcements from financial authorities.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Government Schemes & Benefits",
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-card/50 rounded-lg border border-border/50">
            <h4 className="font-semibold text-primary mb-3">
              Pradhan Mantri Jan Dhan Yojana (PMJDY)
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Zero balance savings account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>RuPay debit card with accident insurance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Overdraft facility after 6 months</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-card/50 rounded-lg border border-border/50">
            <h4 className="font-semibold text-primary mb-3">
              Atal Pension Yojana (APY)
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Guaranteed pension after 60 years</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Co-contribution by government</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Tax benefits under Section 80CCD</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Tax Policy Updates",
      content: (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/20">
                  <th className="border p-3 text-left font-medium">Section</th>
                  <th className="border p-3 text-left font-medium">Benefit</th>
                  <th className="border p-3 text-left font-medium">Limit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["80C", "Investments & Expenses", "1,50,000"],
                  ["80D", "Health Insurance Premium", "25,000 (50,000 for seniors)"],
                  ["80CCD(1B)", "NPS Additional Deduction", "50,000"],
                  ["80E", "Education Loan Interest", "No limit"],
                  ["24(b)", "Home Loan Interest", "2,00,000"]
                ].map(([section, benefit, limit], index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-muted/5" : ""}>
                    <td className="border p-3 font-mono font-medium text-primary">{section}</td>
                    <td className="border p-3">{benefit}</td>
                    <td className="border p-3">{limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      title: "Financial Literacy Resources",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h4 className="font-medium text-green-300">Coming Soon: Interactive Learning</h4>
            </div>
            <p className="text-sm text-green-200/80">
              Interactive modules and quizzes to enhance your financial knowledge.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Recommended Reading</h4>
            <div className="space-y-2">
              {[
                "RBI's Financial Education Initiative",
                "SEBI's Investor Education Program", 
                "PFRDA's Pension Awareness Campaign"
              ].map((resource, index) => (
                <div key={index} className="p-3 bg-card/30 rounded-lg border border-border/30 hover:bg-card/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{resource}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Other Updates",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
            <h4 className="font-medium text-foreground mb-2">Regulatory Changes</h4>
            <p className="text-sm text-muted-foreground">
              Information about upcoming regulatory changes, new financial products, and market updates will be available here.
            </p>
          </div>
          
          <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
            <h4 className="font-medium text-foreground mb-2">Market Announcements</h4>
            <p className="text-sm text-muted-foreground">
              Important announcements from RBI, SEBI, IRDAI, and other financial regulators.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Policy & Regulations</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Stay informed about the latest financial policies, government schemes, and regulatory updates.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {policyContent.map((item, index) => (
          <AccordionItem 
            key={index} 
            value={`item-${index}`}
            className="border border-border rounded-lg overflow-hidden bg-card hover:bg-card/80 transition-all duration-200"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/5">
              <div className="flex items-center justify-between w-full">
                <span className="text-left font-semibold text-lg">{item.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2 bg-muted/5">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default PolicySection;
