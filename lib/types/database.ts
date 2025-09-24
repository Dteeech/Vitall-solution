export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string | null
          plan: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          plan?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          plan?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      core_module: {
        Row: {
          name: string
          title: string
          description: string | null
          icon: string | null
          category: string
          enabled_by_default: boolean
          requires_modules: string[]
          created_at: string
        }
        Insert: {
          name: string
          title: string
          description?: string | null
          icon?: string | null
          category?: string
          enabled_by_default?: boolean
          requires_modules?: string[]
          created_at?: string
        }
        Update: {
          name?: string
          title?: string
          description?: string | null
          icon?: string | null
          category?: string
          enabled_by_default?: boolean
          requires_modules?: string[]
          created_at?: string
        }
      }
      core_organization_module: {
        Row: {
          organization_id: string
          module_name: string
          enabled: boolean
          config: Json
          installed_at: string
        }
        Insert: {
          organization_id: string
          module_name: string
          enabled?: boolean
          config?: Json
          installed_at?: string
        }
        Update: {
          organization_id?: string
          module_name?: string
          enabled?: boolean
          config?: Json
          installed_at?: string
        }
      }
      recruitment_candidate: {
        Row: {
          id: string
          organization_id: string
          name: string
          email: string
          phone: string | null
          cv_url: string | null
          linkedin_url: string | null
          status: string
          score: number
          notes: string | null
          tags: string[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          email: string
          phone?: string | null
          cv_url?: string | null
          linkedin_url?: string | null
          status?: string
          score?: number
          notes?: string | null
          tags?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          email?: string
          phone?: string | null
          cv_url?: string | null
          linkedin_url?: string | null
          status?: string
          score?: number
          notes?: string | null
          tags?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ged_document: {
        Row: {
          id: string
          organization_id: string
          folder_id: string | null
          name: string
          description: string | null
          file_path: string
          file_size: number
          mime_type: string
          version: number
          is_current_version: boolean
          parent_document_id: string | null
          tags: string[]
          metadata: Json
          checksum: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          folder_id?: string | null
          name: string
          description?: string | null
          file_path: string
          file_size?: number
          mime_type: string
          version?: number
          is_current_version?: boolean
          parent_document_id?: string | null
          tags?: string[]
          metadata?: Json
          checksum?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          folder_id?: string | null
          name?: string
          description?: string | null
          file_path?: string
          file_size?: number
          mime_type?: string
          version?: number
          is_current_version?: boolean
          parent_document_id?: string | null
          tags?: string[]
          metadata?: Json
          checksum?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      timesheet_entry: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          project_id: string | null
          date: string
          start_time: string | null
          end_time: string | null
          hours: number
          description: string | null
          status: string
          is_billable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          project_id?: string | null
          date: string
          start_time?: string | null
          end_time?: string | null
          hours: number
          description?: string | null
          status?: string
          is_billable?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          project_id?: string | null
          date?: string
          start_time?: string | null
          end_time?: string | null
          hours?: number
          description?: string | null
          status?: string
          is_billable?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      inventory_item: {
        Row: {
          id: string
          organization_id: string
          sku: string
          name: string
          description: string | null
          category: string | null
          unit: string
          unit_cost: number | null
          selling_price: number | null
          current_stock: number
          reserved_stock: number
          available_stock: number
          reorder_point: number
          max_stock: number | null
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          sku: string
          name: string
          description?: string | null
          category?: string | null
          unit?: string
          unit_cost?: number | null
          selling_price?: number | null
          current_stock?: number
          reserved_stock?: number
          reorder_point?: number
          max_stock?: number | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          sku?: string
          name?: string
          description?: string | null
          category?: string | null
          unit?: string
          unit_cost?: number | null
          selling_price?: number | null
          current_stock?: number
          reserved_stock?: number
          reorder_point?: number
          max_stock?: number | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      accounting_invoice: {
        Row: {
          id: string
          organization_id: string
          customer_id: string | null
          invoice_number: string
          status: string
          issue_date: string
          due_date: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          paid_amount_cents: number
          balance_cents: number
          currency: string
          notes: string | null
          terms: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          customer_id?: string | null
          invoice_number: string
          status?: string
          issue_date?: string
          due_date: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          paid_amount_cents?: number
          currency?: string
          notes?: string | null
          terms?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          customer_id?: string | null
          invoice_number?: string
          status?: string
          issue_date?: string
          due_date?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          paid_amount_cents?: number
          currency?: string
          notes?: string | null
          terms?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          required_role: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}