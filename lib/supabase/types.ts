export type ProfileRow = {
  id: string;
  full_name: string;
  birth_date: string;
  birth_time: string | null;
  gender: string;
  email: string;
  phone: string | null;
  region: string | null;
  membership_tier: "free" | "tactical" | "strategic";
  credit_balance: number;
  created_at: string;
  updated_at: string;
};

export type ReportRow = {
  id: string;
  user_id: string;
  title: string;
  tag: string;
  points: number;
  summary: string;
  sections: { title: string; content: string }[];
  created_at: string;
};

export type CreditTransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProfileRow, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: Omit<ReportRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ReportRow, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      credit_transactions: {
        Row: CreditTransactionRow;
        Insert: Omit<CreditTransactionRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<CreditTransactionRow, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
