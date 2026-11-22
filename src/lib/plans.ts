export const plans = [
  { id: "free", name: "Free", price: "$0", requests: 1_000, keys: "2 active keys", burst: "60 calls / minute", note: "For browser tools, scripts, and side projects." },
  { id: "pro", name: "Pro", price: "$19", requests: 50_000, keys: "10 keys", burst: "600 calls / minute", note: "For a service with regular API traffic." },
  { id: "scale", name: "Scale", price: "$99", requests: 500_000, keys: "Unlimited keys", burst: "2,000 calls / minute", note: "For teams running several integrations." },
  { id: "enterprise", name: "Enterprise", price: "Custom", requests: null, keys: "Custom key policy", burst: "Negotiated rate limit", note: "For custom volume, procurement, and support." },
] as const;

export function planLink(id: typeof plans[number]["id"]) { return id === "free" ? "/dashboard" : `/contact-sales?plan=${id}`; }
