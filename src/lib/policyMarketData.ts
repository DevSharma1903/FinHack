import type { FeedDefinition } from "@/lib/rss";

export const defaultFeeds: FeedDefinition[] = [
  {
    id: "budget-tax",
    title: "Budget / Tax updates (LTGC, slabs)",
    url: "",
    tags: ["budget", "tax", "ltcg"],
  },
  {
    id: "parliament-bills",
    title: "Parliament / Bills (finance, pensions, insurance)",
    url: "",
    tags: ["bill", "pension", "insurance"],
  },
  {
    id: "epfo-labour",
    title: "EPFO / Labour notifications (EPF, gratuity)",
    url: "",
    tags: ["epf", "gratuity", "labour"],
  },
];

export const policyLibrarySeed = [
  { instrument: "SIP", category: "Tax", note: "Equity taxation rules (STCG/LTCG), holding period definitions" },
  { instrument: "SIP", category: "Regulatory", note: "SEBI MF regulations, disclosure norms, risk-o-meter" },
  { instrument: "FD", category: "Tax", note: "Interest income taxable as per slab; TDS applicability" },
  { instrument: "FD", category: "Banking", note: "DICGC coverage limits; issuer credit risk" },
  { instrument: "RD", category: "Tax", note: "Interest taxable as per slab; TDS depends on issuer" },
  { instrument: "NPS", category: "Tax", note: "80C/80CCD benefits and withdrawal taxation rules" },
  { instrument: "EPF", category: "Policy", note: "Interest notification, withdrawal rules, taxation for certain cases" },
  { instrument: "Gratuity", category: "Labour", note: "Payment of Gratuity Act rules; eligibility and ceiling" },
  { instrument: "Term Insurance", category: "Insurance", note: "Claim settlement, riders, nominee/legal heir considerations" },
];
