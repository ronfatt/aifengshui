import type { CreditSource, MembershipTier, PartnerPackage, ReportSection, ReportType } from "@/lib/types";

export type ProfileRow = {
  id: string;
  full_name: string;
  birth_date: string;
  birth_time: string | null;
  gender: string;
  email: string;
  phone: string | null;
  region: string | null;
  membership_tier: MembershipTier;
  partner_package?: PartnerPackage;
  credit_balance: number;
  created_at: string;
  updated_at: string;
};

export type ReportRow = {
  id: string;
  user_id: string;
  title: string;
  tag: ReportType | string;
  points: number;
  summary: string;
  sections: ReportSection[];
  created_at: string;
};

export type CreditTransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  source: CreditSource | string;
  description: string | null;
  created_at: string;
};

export type PaymentOrderRow = {
  id: string;
  order_no: string;
  user_id: string;
  order_type: "credit_topup" | "subscription" | "agent_package" | "product" | "course" | "ai_report" | "service";
  status: "pending" | "paid" | "processing" | "completed" | "failed" | "cancelled" | "refunded";
  payment_status: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  payment_method: string;
  currency: string;
  amount_cents: number;
  credit_amount: number;
  membership_tier: MembershipTier | null;
  partner_package: PartnerPackage | null;
  description: string;
  metadata: Record<string, unknown>;
  gateway_transaction_id: string | null;
  senangpay_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentTransactionRow = {
  id: string;
  order_id: string;
  gateway: string;
  gateway_order_id: string;
  transaction_id: string | null;
  amount_cents: number;
  status: string;
  message: string | null;
  raw_payload: Record<string, unknown>;
  verified: boolean;
  created_at: string;
};

export type AccountingAccountRow = {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normal_balance: "debit" | "credit";
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AccountingJournalRow = {
  id: string;
  journal_no: string;
  source_module: string;
  source_id: string | null;
  period: string;
  journal_date: string;
  description: string;
  status: "draft" | "posted" | "void";
  total_debit: number;
  total_credit: number;
  created_by: string | null;
  approved_by: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AccountingJournalLineRow = {
  id: string;
  journal_id: string;
  line_no: number;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  memo: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
};

export type AccountingAuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
};

export type AccountingSyncBatchRow = {
  id: string;
  provider: string;
  period: string;
  status: "draft" | "exported" | "synced" | "failed";
  exported_by: string | null;
  file_name: string | null;
  row_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
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
      payment_orders: {
        Row: PaymentOrderRow;
        Insert: Omit<PaymentOrderRow, "id" | "created_at" | "updated_at" | "paid_at" | "gateway_transaction_id" | "senangpay_transaction_id" | "status" | "payment_status" | "payment_method" | "currency" | "credit_amount" | "metadata"> & {
          id?: string;
          status?: PaymentOrderRow["status"];
          payment_status?: PaymentOrderRow["payment_status"];
          payment_method?: string;
          currency?: string;
          credit_amount?: number;
          metadata?: Record<string, unknown>;
          gateway_transaction_id?: string | null;
          senangpay_transaction_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PaymentOrderRow, "id" | "order_no" | "user_id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: PaymentTransactionRow;
        Insert: Omit<PaymentTransactionRow, "id" | "created_at" | "gateway" | "amount_cents" | "verified" | "raw_payload" | "transaction_id" | "message"> & {
          id?: string;
          gateway?: string;
          transaction_id?: string | null;
          amount_cents?: number;
          message?: string | null;
          raw_payload?: Record<string, unknown>;
          verified?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<PaymentTransactionRow, "id" | "order_id" | "created_at">>;
        Relationships: [];
      };
      accounting_accounts: {
        Row: AccountingAccountRow;
        Insert: Omit<AccountingAccountRow, "id" | "created_at" | "updated_at" | "is_active"> & {
          id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AccountingAccountRow, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      accounting_journals: {
        Row: AccountingJournalRow;
        Insert: {
          id?: string;
          journal_no: string;
          source_module: string;
          source_id?: string | null;
          period: string;
          journal_date?: string;
          description: string;
          status?: "draft" | "posted" | "void";
          total_debit?: number;
          total_credit?: number;
          created_by?: string | null;
          approved_by?: string | null;
          posted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AccountingJournalRow, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      accounting_journal_lines: {
        Row: AccountingJournalLineRow;
        Insert: Omit<AccountingJournalLineRow, "id" | "created_at" | "memo" | "entity_type" | "entity_id"> & {
          id?: string;
          memo?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<AccountingJournalLineRow, "id" | "journal_id" | "created_at">>;
        Relationships: [];
      };
      accounting_audit_logs: {
        Row: AccountingAuditLogRow;
        Insert: Omit<AccountingAuditLogRow, "id" | "created_at" | "actor_id" | "actor_email" | "entity_id" | "before_data" | "after_data"> & {
          id?: string;
          actor_id?: string | null;
          actor_email?: string | null;
          entity_id?: string | null;
          before_data?: Record<string, unknown> | null;
          after_data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Omit<AccountingAuditLogRow, "id" | "created_at">>;
        Relationships: [];
      };
      accounting_sync_batches: {
        Row: AccountingSyncBatchRow;
        Insert: Omit<AccountingSyncBatchRow, "id" | "created_at" | "updated_at" | "status" | "exported_by" | "file_name" | "row_count" | "error_message"> & {
          id?: string;
          status?: "draft" | "exported" | "synced" | "failed";
          exported_by?: string | null;
          file_name?: string | null;
          row_count?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AccountingSyncBatchRow, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
