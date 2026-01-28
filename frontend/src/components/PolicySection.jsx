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
          <div className="p-4 bg-muted/20 border border-border rounded-lg">
            <h4 className="font-medium text-foreground">RSS feed integration (coming soon)</h4>
            <p className="mt-2 text-sm text-muted-foreground">
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
          <div className="p-4 bg-card rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-3">
              Pradhan Mantri Jan Dhan Yojana (PMJDY)
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                <span>Zero balance savings account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                <span>RuPay debit card with accident insurance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                <span>Overdraft facility after 6 months</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-card rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-3">
              Atal Pension Yojana (APY)
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                <span>Guaranteed pension after 60 years</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                <span>Co-contribution by government</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
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
                    <td className="border p-3 font-mono font-medium text-foreground">{section}</td>
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
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Recommended Reading</h4>
            <div className="space-y-2">
              <a 
                href="https://www.rbi.org.in/FinancialEducation/Home.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-card rounded-lg border border-border hover:bg-secondary transition-colors duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground hover:text-primary">RBI's Financial Education Initiative</span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
              
              <a 
                href="https://investor.sebi.gov.in/iematerial.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-card rounded-lg border border-border hover:bg-secondary transition-colors duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground hover:text-primary">SEBI's Investor Education Program</span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
              
              <a 
                href="https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2174235&reg=3&lang=2"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-card rounded-lg border border-border hover:bg-secondary transition-colors duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground hover:text-primary">PFRDA's Pension Awareness Campaign</span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
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
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Policy & Regulations</h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          Stay informed about the latest financial policies, government schemes, and regulatory updates.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {policyContent.map((item, index) => (
          <AccordionItem 
            key={index} 
            value={`item-${index}`}
            className="border border-border rounded-lg overflow-hidden bg-card hover:bg-secondary transition-colors duration-200"
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
