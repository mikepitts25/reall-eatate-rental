/**
 * Hand-authored to mirror supabase/migrations. In a real workflow regenerate
 * with: `npm run db:types` (supabase gen types typescript).
 */

export type UserRole = "owner" | "operator" | "admin";
export type PropertyType =
  | "single_family"
  | "multi_family"
  | "condo"
  | "townhouse"
  | "apartment"
  | "other";
export type ListingStatus =
  | "draft"
  | "active"
  | "under_offer"
  | "leased"
  | "archived";
export type ProposalStatus =
  | "pending"
  | "countered"
  | "accepted"
  | "rejected"
  | "withdrawn";
export type AgreementStatus =
  | "draft"
  | "sent"
  | "owner_signed"
  | "operator_signed"
  | "active"
  | "terminated";
export type PaymentStatus = "scheduled" | "paid" | "late" | "missed";
export type NotificationType =
  | "proposal_received"
  | "proposal_updated"
  | "message_received"
  | "agreement_updated"
  | "payment_due"
  | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          company_name: string | null;
          bio: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          company_name?: string | null;
          bio?: string | null;
          is_verified?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          property_type: PropertyType;
          status: ListingStatus;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string;
          latitude: number | null;
          longitude: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          square_feet: number | null;
          monthly_mortgage: number;
          estimated_market_rent: number;
          desired_monthly_rent: number;
          lease_restrictions: string | null;
          min_lease_months: number;
          available_from: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          property_type?: PropertyType;
          status?: ListingStatus;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_feet?: number | null;
          monthly_mortgage?: number;
          estimated_market_rent?: number;
          desired_monthly_rent?: number;
          lease_restrictions?: string | null;
          min_lease_months?: number;
          available_from?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
        Relationships: [];
      };
      property_photos: {
        Row: {
          id: string;
          property_id: string;
          storage_path: string;
          public_url: string | null;
          position: number;
          is_cover: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          storage_path: string;
          public_url?: string | null;
          position?: number;
          is_cover?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["property_photos"]["Insert"]>;
        Relationships: [];
      };
      proposals: {
        Row: {
          id: string;
          property_id: string;
          operator_id: string;
          owner_id: string;
          status: ProposalStatus;
          offered_monthly_rent: number;
          lease_term_months: number;
          security_deposit: number;
          intended_use: string | null;
          estimated_expenses: number;
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          operator_id: string;
          owner_id: string;
          status?: ProposalStatus;
          offered_monthly_rent: number;
          lease_term_months?: number;
          security_deposit?: number;
          intended_use?: string | null;
          estimated_expenses?: number;
          message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["proposals"]["Insert"]>;
        Relationships: [];
      };
      agreements: {
        Row: {
          id: string;
          proposal_id: string;
          property_id: string;
          owner_id: string;
          operator_id: string;
          status: AgreementStatus;
          monthly_rent: number;
          lease_term_months: number;
          start_date: string | null;
          end_date: string | null;
          terms: string | null;
          owner_signed_at: string | null;
          operator_signed_at: string | null;
          document_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          property_id: string;
          owner_id: string;
          operator_id: string;
          status?: AgreementStatus;
          monthly_rent: number;
          lease_term_months?: number;
          start_date?: string | null;
          end_date?: string | null;
          terms?: string | null;
          owner_signed_at?: string | null;
          operator_signed_at?: string | null;
          document_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agreements"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          agreement_id: string;
          due_date: string;
          amount: number;
          status: PaymentStatus;
          paid_at: string | null;
          method: string | null;
          reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agreement_id: string;
          due_date: string;
          amount: number;
          status?: PaymentStatus;
          paid_at?: string | null;
          method?: string | null;
          reference?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          proposal_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          sender_id: string;
          body: string;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [key: string]: never };
    Functions: {
      create_notification: {
        Args: {
          p_user_id: string;
          p_type: NotificationType;
          p_title: string;
          p_body?: string | null;
          p_link?: string | null;
        };
        Returns: string;
      };
    };
    CompositeTypes: { [key: string]: never };
    Enums: {
      user_role: UserRole;
      property_type: PropertyType;
      listing_status: ListingStatus;
      proposal_status: ProposalStatus;
      agreement_status: AgreementStatus;
      payment_status: PaymentStatus;
      notification_type: NotificationType;
    };
  };
}

// Convenience row aliases ----------------------------------------------------
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyPhoto =
  Database["public"]["Tables"]["property_photos"]["Row"];
export type Proposal = Database["public"]["Tables"]["proposals"]["Row"];
export type Agreement = Database["public"]["Tables"]["agreements"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
