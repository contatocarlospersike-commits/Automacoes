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
          timezone: string
          subscription_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          timezone?: string
          subscription_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          timezone?: string
          subscription_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      waba_configs: {
        Row: {
          id: string
          org_id: string
          phone_number_id: string
          waba_id: string
          encrypted_access_token: string | null
          encrypted_app_secret: string | null
          is_connected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          phone_number_id: string
          waba_id: string
          encrypted_access_token?: string | null
          encrypted_app_secret?: string | null
          is_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          phone_number_id?: string
          waba_id?: string
          encrypted_access_token?: string | null
          encrypted_app_secret?: string | null
          is_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waba_configs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      contacts: {
        Row: {
          id: string
          org_id: string
          name: string
          phone: string
          email: string | null
          consent_given_at: string | null
          consent_source: string | null
          opted_out_at: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          phone: string
          email?: string | null
          consent_given_at?: string | null
          consent_source?: string | null
          opted_out_at?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          phone?: string
          email?: string | null
          consent_given_at?: string | null
          consent_source?: string | null
          opted_out_at?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      message_templates: {
        Row: {
          id: string
          org_id: string
          name: string
          category: string
          body: string
          buttons: Json | null
          variables: Json | null
          meta_template_id: string | null
          meta_template_name: string | null
          status: string
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          category: string
          body: string
          buttons?: Json | null
          variables?: Json | null
          meta_template_id?: string | null
          meta_template_name?: string | null
          status?: string
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          category?: string
          body?: string
          buttons?: Json | null
          variables?: Json | null
          meta_template_id?: string | null
          meta_template_name?: string | null
          status?: string
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      campaigns: {
        Row: {
          id: string
          org_id: string
          name: string
          template_id: string
          status: string
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          total_messages: number
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          template_id: string
          status?: string
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          total_messages?: number
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          template_id?: string
          status?: string
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          total_messages?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      message_queue: {
        Row: {
          id: string
          campaign_id: string
          contact_id: string
          phone: string
          template_name: string
          variables: Json | null
          status: string
          meta_message_id: string | null
          attempts: number
          error: string | null
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          contact_id: string
          phone: string
          template_name: string
          variables?: Json | null
          status?: string
          meta_message_id?: string | null
          attempts?: number
          error?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          contact_id?: string
          phone?: string
          template_name?: string
          variables?: Json | null
          status?: string
          meta_message_id?: string | null
          attempts?: number
          error?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      plans: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          monthly_price_cents: number
          message_unit_price_cents: number
          max_contacts: number | null
          max_campaigns_per_month: number | null
          max_messages_per_month: number | null
          features: Json
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          monthly_price_cents: number
          message_unit_price_cents: number
          max_contacts?: number | null
          max_campaigns_per_month?: number | null
          max_messages_per_month?: number | null
          features?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          monthly_price_cents?: number
          message_unit_price_cents?: number
          max_contacts?: number | null
          max_campaigns_per_month?: number | null
          max_messages_per_month?: number | null
          features?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          org_id: string
          plan_id: string
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          status: string
          billing_type: string
          current_period_start: string | null
          current_period_end: string | null
          trial_ends_at: string | null
          cancelled_at: string | null
          gifted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          plan_id: string
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          status?: string
          billing_type?: string
          current_period_start?: string | null
          current_period_end?: string | null
          trial_ends_at?: string | null
          cancelled_at?: string | null
          gifted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          plan_id?: string
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          status?: string
          billing_type?: string
          current_period_start?: string | null
          current_period_end?: string | null
          trial_ends_at?: string | null
          cancelled_at?: string | null
          gifted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          }
        ]
      }
      usage_records: {
        Row: {
          id: string
          org_id: string
          period_start: string
          period_end: string
          message_count: number
          unit_price_cents: number
          total_cost_cents: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          period_start: string
          period_end: string
          message_count?: number
          unit_price_cents: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          period_start?: string
          period_end?: string
          message_count?: number
          unit_price_cents?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          org_id: string
          subscription_id: string | null
          usage_record_id: string | null
          period_start: string
          period_end: string
          subscription_amount_cents: number
          usage_amount_cents: number
          total_amount_cents: number
          status: string
          asaas_payment_id: string | null
          asaas_invoice_url: string | null
          due_date: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          subscription_id?: string | null
          usage_record_id?: string | null
          period_start: string
          period_end: string
          subscription_amount_cents?: number
          usage_amount_cents?: number
          total_amount_cents?: number
          status?: string
          asaas_payment_id?: string | null
          asaas_invoice_url?: string | null
          due_date?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          subscription_id?: string | null
          usage_record_id?: string | null
          period_start?: string
          period_end?: string
          subscription_amount_cents?: number
          usage_amount_cents?: number
          total_amount_cents?: number
          status?: string
          asaas_payment_id?: string | null
          asaas_invoice_url?: string | null
          due_date?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_events: {
        Row: {
          id: string
          asaas_event_id: string
          event_type: string
          asaas_payment_id: string | null
          asaas_subscription_id: string | null
          payload: Json
          processed: boolean
          processing_error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          asaas_event_id: string
          event_type: string
          asaas_payment_id?: string | null
          asaas_subscription_id?: string | null
          payload: Json
          processed?: boolean
          processing_error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asaas_event_id?: string
          event_type?: string
          asaas_payment_id?: string | null
          asaas_subscription_id?: string | null
          payload?: Json
          processed?: boolean
          processing_error?: string | null
          created_at?: string
        }
        Relationships: []
      }
      automations: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          trigger_type: string
          trigger_config: Json
          flow_json: Json
          is_active: boolean
          enrolled_count: number
          completed_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string | null
          trigger_type?: string
          trigger_config?: Json
          flow_json?: Json
          is_active?: boolean
          enrolled_count?: number
          completed_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          description?: string | null
          trigger_type?: string
          trigger_config?: Json
          flow_json?: Json
          is_active?: boolean
          enrolled_count?: number
          completed_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      automation_enrollments: {
        Row: {
          id: string
          automation_id: string
          contact_id: string
          current_node_id: string | null
          status: string
          next_step_at: string | null
          enrolled_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          automation_id: string
          contact_id: string
          current_node_id?: string | null
          status?: string
          next_step_at?: string | null
          enrolled_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          automation_id?: string
          contact_id?: string
          current_node_id?: string | null
          status?: string
          next_step_at?: string | null
          enrolled_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          id: string
          org_id: string
          name: string
          subject: string
          from_name: string
          html_body: string
          preview_text: string | null
          variables: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          subject: string
          from_name?: string
          html_body: string
          preview_text?: string | null
          variables?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          subject?: string
          from_name?: string
          html_body?: string
          preview_text?: string | null
          variables?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      email_campaigns: {
        Row: {
          id: string
          org_id: string
          name: string
          email_template_id: string
          from_name: string
          from_email: string
          reply_to: string | null
          target_type: string
          target_group_id: string | null
          target_tag_id: string | null
          status: string
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          total_recipients: number
          total_sent: number
          total_opened: number
          total_clicked: number
          total_bounced: number
          total_failed: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          email_template_id: string
          from_name: string
          from_email: string
          reply_to?: string | null
          target_type?: string
          target_group_id?: string | null
          target_tag_id?: string | null
          status?: string
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          total_recipients?: number
          total_sent?: number
          total_opened?: number
          total_clicked?: number
          total_bounced?: number
          total_failed?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          email_template_id?: string
          from_name?: string
          from_email?: string
          reply_to?: string | null
          target_type?: string
          target_group_id?: string | null
          target_tag_id?: string | null
          status?: string
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          total_recipients?: number
          total_sent?: number
          total_opened?: number
          total_clicked?: number
          total_bounced?: number
          total_failed?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["email_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      email_queue: {
        Row: {
          id: string
          email_campaign_id: string
          contact_id: string | null
          email: string
          contact_name: string | null
          variables: Json
          status: string
          resend_email_id: string | null
          attempts: number
          failed_reason: string | null
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email_campaign_id: string
          contact_id?: string | null
          email: string
          contact_name?: string | null
          variables?: Json
          status?: string
          resend_email_id?: string | null
          attempts?: number
          failed_reason?: string | null
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email_campaign_id?: string
          contact_id?: string | null
          email?: string
          contact_name?: string | null
          variables?: Json
          status?: string
          resend_email_id?: string | null
          attempts?: number
          failed_reason?: string | null
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_campaign_id_fkey"
            columns: ["email_campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_groups: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string | null
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          description?: string | null
          color?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_group_members: {
        Row: {
          group_id: string
          contact_id: string
          added_at: string
        }
        Insert: {
          group_id: string
          contact_id: string
          added_at?: string
        }
        Update: {
          group_id?: string
          contact_id?: string
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_group_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_tags: {
        Row: {
          id: string
          org_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_tag_assignments: {
        Row: {
          tag_id: string
          contact_id: string
          assigned_at: string
        }
        Insert: {
          tag_id: string
          contact_id: string
          assigned_at?: string
        }
        Update: {
          tag_id?: string
          contact_id?: string
          assigned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "contact_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tag_assignments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      webhook_logs: {
        Row: {
          id: string
          org_id: string
          payload: Json
          event_type: string
          processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          payload: Json
          event_type: string
          processed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          payload?: Json
          event_type?: string
          processed?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: {
        Args: Record<string, never>
        Returns: string
      }
      encrypt_text: {
        Args: {
          plain_text: string
          encryption_key: string
        }
        Returns: string
      }
      decrypt_text: {
        Args: {
          encrypted_data: string
          encryption_key: string
        }
        Returns: string
      }
      increment_usage: {
        Args: {
          p_org_id: string
          p_count: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
