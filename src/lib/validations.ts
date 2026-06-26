import { z } from "zod";

export const userRoleSchema = z.enum(["owner", "operator", "admin"]);

export const propertyTypeSchema = z.enum([
  "single_family",
  "multi_family",
  "condo",
  "townhouse",
  "apartment",
  "other",
]);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const signupSchema = z.object({
  fullName: z.string().min(2, "Please enter your name").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["owner", "operator"], {
    required_error: "Choose how you'll use LeaseFlip",
  }),
  // Checkbox: HTML sends "on" when checked, nothing when unchecked.
  acceptedTerms: z
    .preprocess(
      (v) => v === "on" || v === "true" || v === true,
      z.boolean()
    )
    .refine((v) => v === true, {
      message: "You must accept the Terms, Privacy Policy, and e-sign consent",
    }),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Property listing
// ---------------------------------------------------------------------------
const money = z.coerce.number().min(0, "Must be 0 or more");

export const propertySchema = z.object({
  title: z.string().min(4, "Give your listing a descriptive title").max(160),
  description: z.string().max(4000).optional().or(z.literal("")),
  property_type: propertyTypeSchema,
  status: z.enum(["draft", "active"]).default("active"),
  address_line1: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(120),
  state: z.string().min(1, "State is required").max(60),
  postal_code: z.string().max(20).optional().or(z.literal("")),
  bedrooms: z.coerce.number().min(0).max(50).optional(),
  bathrooms: z.coerce.number().min(0).max(50).optional(),
  square_feet: z.coerce.number().int().min(0).max(1_000_000).optional(),
  monthly_mortgage: money,
  estimated_market_rent: money,
  desired_monthly_rent: money,
  lease_restrictions: z.string().max(2000).optional().or(z.literal("")),
  min_lease_months: z.coerce.number().int().min(1).max(120).default(12),
  available_from: z.string().optional().or(z.literal("")),
});
export type PropertyInput = z.infer<typeof propertySchema>;

// ---------------------------------------------------------------------------
// Proposal
// ---------------------------------------------------------------------------
export const proposalSchema = z.object({
  property_id: z.string().uuid(),
  offered_monthly_rent: z.coerce.number().min(1, "Enter your monthly offer"),
  lease_term_months: z.coerce.number().int().min(1).max(120).default(12),
  security_deposit: z.coerce.number().min(0).default(0),
  intended_use: z.string().max(500).optional().or(z.literal("")),
  estimated_expenses: z.coerce.number().min(0).default(0),
  message: z.string().max(2000).optional().or(z.literal("")),
});
export type ProposalInput = z.infer<typeof proposalSchema>;

export const proposalResponseSchema = z.object({
  proposal_id: z.string().uuid(),
  action: z.enum(["accept", "reject", "counter", "withdraw"]),
  counter_amount: z.coerce.number().min(0).optional(),
});
export type ProposalResponseInput = z.infer<typeof proposalResponseSchema>;

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------
export const messageSchema = z.object({
  proposal_id: z.string().uuid(),
  body: z.string().min(1, "Type a message").max(4000),
});
export type MessageInput = z.infer<typeof messageSchema>;

// ---------------------------------------------------------------------------
// Marketplace filters
// ---------------------------------------------------------------------------
export const propertyFilterSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  property_type: propertyTypeSchema.optional(),
  min_roi: z.coerce.number().optional(),
  sort: z.enum(["newest", "roi", "rent_low", "rent_high"]).default("newest"),
});
export type PropertyFilterInput = z.infer<typeof propertyFilterSchema>;
