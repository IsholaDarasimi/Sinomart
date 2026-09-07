// AUTO-GENERATED from the live Sinomart Postgres schema via gen-types.js
// (introspection-based generator; no Docker required). Regenerate after any migration
// change: node gen-types.js > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          customer_id: string
          full_name: string
          phone: string
          address_line: string
          city: string
          state: string
          area: string | null
          landmark: string | null
          delivery_instructions: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          full_name: string
          phone: string
          address_line: string
          city: string
          state?: string
          area?: string | null
          landmark?: string | null
          delivery_instructions?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          full_name?: string
          phone?: string
          address_line?: string
          city?: string
          state?: string
          area?: string | null
          landmark?: string | null
          delivery_instructions?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "addresses_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      admin_permissions: {
        Row: {
          admin_id: string
          area_key: string
          can_view: boolean
          can_edit: boolean
          can_delete: boolean
          granted_by: string | null
          granted_at: string
        }
        Insert: {
          admin_id: string
          area_key: string
          can_view?: boolean
          can_edit?: boolean
          can_delete?: boolean
          granted_by?: string | null
          granted_at?: string
        }
        Update: {
          admin_id?: string
          area_key?: string
          can_view?: boolean
          can_edit?: boolean
          can_delete?: boolean
          granted_by?: string | null
          granted_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "admin_permissions_admin_id_fkey"
              columns: ["admin_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "admin_permissions_area_key_fkey"
              columns: ["area_key"]
              referencedRelation: "permission_areas"
              referencedColumns: ["key"]
            },
            {
              foreignKeyName: "admin_permissions_granted_by_fkey"
              columns: ["granted_by"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      analytics_events: {
        Row: {
          id: string
          event_type: "product_view" | "category_view" | "search" | "search_result_click" | "banner_view" | "banner_click" | "add_to_cart" | "remove_from_cart" | "save_product" | "unsave_product" | "checkout_started" | "payment_started" | "payment_success" | "payment_failed" | "order_created" | "order_delivered" | "review_created"
          session_id: string
          customer_id: string | null
          product_id: string | null
          category_id: string | null
          order_id: string | null
          banner_id: string | null
          campaign_id: string | null
          metadata: Json
          source: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: "product_view" | "category_view" | "search" | "search_result_click" | "banner_view" | "banner_click" | "add_to_cart" | "remove_from_cart" | "save_product" | "unsave_product" | "checkout_started" | "payment_started" | "payment_success" | "payment_failed" | "order_created" | "order_delivered" | "review_created"
          session_id: string
          customer_id?: string | null
          product_id?: string | null
          category_id?: string | null
          order_id?: string | null
          banner_id?: string | null
          campaign_id?: string | null
          metadata?: Json
          source?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: "product_view" | "category_view" | "search" | "search_result_click" | "banner_view" | "banner_click" | "add_to_cart" | "remove_from_cart" | "save_product" | "unsave_product" | "checkout_started" | "payment_started" | "payment_success" | "payment_failed" | "order_created" | "order_delivered" | "review_created"
          session_id?: string
          customer_id?: string | null
          product_id?: string | null
          category_id?: string | null
          order_id?: string | null
          banner_id?: string | null
          campaign_id?: string | null
          metadata?: Json
          source?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "analytics_events_banner_id_fkey"
              columns: ["banner_id"]
              referencedRelation: "homepage_banners"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "analytics_events_campaign_id_fkey"
              columns: ["campaign_id"]
              referencedRelation: "campaigns"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "analytics_events_category_id_fkey"
              columns: ["category_id"]
              referencedRelation: "categories"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "analytics_events_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "analytics_events_order_id_fkey"
              columns: ["order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "analytics_events_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            }
          ]
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          before_state: Json | null
          after_state: Json | null
          metadata: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          before_state?: Json | null
          after_state?: Json | null
          metadata?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          before_state?: Json | null
          after_state?: Json | null
          metadata?: Json
          ip_address?: string | null
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "audit_logs_actor_id_fkey"
              columns: ["actor_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      banner_events: {
        Row: {
          id: string
          banner_id: string
          event_type: string
          session_id: string | null
          customer_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          banner_id: string
          event_type: string
          session_id?: string | null
          customer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          banner_id?: string
          event_type?: string
          session_id?: string | null
          customer_id?: string | null
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "banner_events_banner_id_fkey"
              columns: ["banner_id"]
              referencedRelation: "homepage_banners"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "banner_events_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
          Relationships: []
      }
      campaign_products: {
        Row: {
          campaign_id: string
          product_id: string
          discount_type: "percentage" | "fixed" | null
          discount_value: number | null
          added_at: string
        }
        Insert: {
          campaign_id: string
          product_id: string
          discount_type?: "percentage" | "fixed" | null
          discount_value?: number | null
          added_at?: string
        }
        Update: {
          campaign_id?: string
          product_id?: string
          discount_type?: "percentage" | "fixed" | null
          discount_value?: number | null
          added_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "campaign_products_campaign_id_fkey"
              columns: ["campaign_id"]
              referencedRelation: "campaigns"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "campaign_products_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            }
          ]
      }
      campaigns: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          banner_image_url: string | null
          grants_free_delivery: boolean
          starts_at: string | null
          ends_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          banner_image_url?: string | null
          grants_free_delivery?: boolean
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          banner_image_url?: string | null
          grants_free_delivery?: boolean
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
          Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          product_id: string
          variant_id: string | null
          purchase_option_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          product_id: string
          variant_id?: string | null
          purchase_option_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          product_id?: string
          variant_id?: string | null
          purchase_option_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "cart_items_cart_id_fkey"
              columns: ["cart_id"]
              referencedRelation: "carts"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "cart_items_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "cart_items_purchase_option_id_fkey"
              columns: ["purchase_option_id"]
              referencedRelation: "purchase_options"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "cart_items_variant_id_fkey"
              columns: ["variant_id"]
              referencedRelation: "product_variants"
              referencedColumns: ["id"]
            }
          ]
      }
      carts: {
        Row: {
          id: string
          customer_id: string | null
          session_id: string | null
          status: string
          converted_order_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          session_id?: string | null
          status?: string
          converted_order_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          session_id?: string | null
          status?: string
          converted_order_id?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "carts_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "fk_carts_converted_order"
              columns: ["converted_order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            }
          ]
      }
      categories: {
        Row: {
          id: string
          parent_id: string | null
          name: string
          slug: string
          description: string | null
          image_url: string | null
          storage_path: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_id?: string | null
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          storage_path?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          storage_path?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "categories_parent_id_fkey"
              columns: ["parent_id"]
              referencedRelation: "categories"
              referencedColumns: ["id"]
            }
          ]
      }
      conversations: {
        Row: {
          id: string
          customer_id: string
          order_id: string | null
          category: "support" | "order" | "delivery" | "payment" | "general"
          subject: string | null
          status: "open" | "pending" | "closed"
          assigned_admin_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          order_id?: string | null
          category?: "support" | "order" | "delivery" | "payment" | "general"
          subject?: string | null
          status?: "open" | "pending" | "closed"
          assigned_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          order_id?: string | null
          category?: "support" | "order" | "delivery" | "payment" | "general"
          subject?: string | null
          status?: "open" | "pending" | "closed"
          assigned_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "conversations_assigned_admin_id_fkey"
              columns: ["assigned_admin_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "conversations_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "conversations_order_id_fkey"
              columns: ["order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            }
          ]
      }
      coupon_usages: {
        Row: {
          id: string
          coupon_id: string
          customer_id: string
          order_id: string | null
          discount_amount: number
          used_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          customer_id: string
          order_id?: string | null
          discount_amount: number
          used_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          customer_id?: string
          order_id?: string | null
          discount_amount?: number
          used_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "coupon_usages_coupon_id_fkey"
              columns: ["coupon_id"]
              referencedRelation: "coupons"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "coupon_usages_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "fk_coupon_usages_order"
              columns: ["order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            }
          ]
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          coupon_type: "percentage" | "fixed" | "free_delivery"
          percentage_value: number | null
          fixed_value: number | null
          grants_free_delivery: boolean
          minimum_order_amount: number
          maximum_discount_amount: number | null
          usage_limit: number | null
          customer_usage_limit: number
          times_used: number
          starts_at: string
          ends_at: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          coupon_type: "percentage" | "fixed" | "free_delivery"
          percentage_value?: number | null
          fixed_value?: number | null
          grants_free_delivery?: boolean
          minimum_order_amount?: number
          maximum_discount_amount?: number | null
          usage_limit?: number | null
          customer_usage_limit?: number
          times_used?: number
          starts_at?: string
          ends_at?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          coupon_type?: "percentage" | "fixed" | "free_delivery"
          percentage_value?: number | null
          fixed_value?: number | null
          grants_free_delivery?: boolean
          minimum_order_amount?: number
          maximum_discount_amount?: number | null
          usage_limit?: number | null
          customer_usage_limit?: number
          times_used?: number
          starts_at?: string
          ends_at?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "coupons_created_by_fkey"
              columns: ["created_by"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      delivery_zone_areas: {
        Row: {
          id: string
          zone_id: string
          area_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          zone_id: string
          area_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          zone_id?: string
          area_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "delivery_zone_areas_zone_id_fkey"
              columns: ["zone_id"]
              referencedRelation: "delivery_zones"
              referencedColumns: ["id"]
            }
          ]
      }
      delivery_zones: {
        Row: {
          id: string
          name: string
          description: string | null
          fee: number
          free_delivery_threshold: number | null
          minimum_order_amount: number
          estimated_min_days: number
          estimated_max_days: number
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          fee: number
          free_delivery_threshold?: number | null
          minimum_order_amount?: number
          estimated_min_days?: number
          estimated_max_days?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          fee?: number
          free_delivery_threshold?: number | null
          minimum_order_amount?: number
          estimated_min_days?: number
          estimated_max_days?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
          Relationships: []
      }
      email_logs: {
        Row: {
          id: string
          recipient_email: string
          customer_id: string | null
          email_type: "welcome" | "order_confirmation" | "payment_confirmation" | "order_processing" | "order_dispatched" | "order_delivered" | "password_reset" | "security_alert" | "review_reminder" | "newsletter" | "admin_alert"
          related_order_id: string | null
          status: "queued" | "sent" | "failed" | "bounced"
          provider_reference: string | null
          failure_reason: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_email: string
          customer_id?: string | null
          email_type: "welcome" | "order_confirmation" | "payment_confirmation" | "order_processing" | "order_dispatched" | "order_delivered" | "password_reset" | "security_alert" | "review_reminder" | "newsletter" | "admin_alert"
          related_order_id?: string | null
          status?: "queued" | "sent" | "failed" | "bounced"
          provider_reference?: string | null
          failure_reason?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_email?: string
          customer_id?: string | null
          email_type?: "welcome" | "order_confirmation" | "payment_confirmation" | "order_processing" | "order_dispatched" | "order_delivered" | "password_reset" | "security_alert" | "review_reminder" | "newsletter" | "admin_alert"
          related_order_id?: string | null
          status?: "queued" | "sent" | "failed" | "bounced"
          provider_reference?: string | null
          failure_reason?: string | null
          sent_at?: string | null
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "email_logs_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "email_logs_related_order_id_fkey"
              columns: ["related_order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            }
          ]
      }
      homepage_banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          image_url: string
          storage_path: string | null
          cta_text: string | null
          destination_type: "category" | "campaign" | "product" | "external_url" | "none"
          destination_category_id: string | null
          destination_campaign_id: string | null
          destination_product_id: string | null
          destination_url: string | null
          starts_at: string | null
          ends_at: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          image_url: string
          storage_path?: string | null
          cta_text?: string | null
          destination_type?: "category" | "campaign" | "product" | "external_url" | "none"
          destination_category_id?: string | null
          destination_campaign_id?: string | null
          destination_product_id?: string | null
          destination_url?: string | null
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          image_url?: string
          storage_path?: string | null
          cta_text?: string | null
          destination_type?: "category" | "campaign" | "product" | "external_url" | "none"
          destination_category_id?: string | null
          destination_campaign_id?: string | null
          destination_product_id?: string | null
          destination_url?: string | null
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "homepage_banners_destination_campaign_id_fkey"
              columns: ["destination_campaign_id"]
              referencedRelation: "campaigns"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "homepage_banners_destination_category_id_fkey"
              columns: ["destination_category_id"]
              referencedRelation: "categories"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "homepage_banners_destination_product_id_fkey"
              columns: ["destination_product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            }
          ]
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          variant_id: string | null
          quantity_on_hand: number
          quantity_reserved: number
          low_stock_threshold: number
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          variant_id?: string | null
          quantity_on_hand?: number
          quantity_reserved?: number
          low_stock_threshold?: number
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          variant_id?: string | null
          quantity_on_hand?: number
          quantity_reserved?: number
          low_stock_threshold?: number
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "inventory_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "inventory_variant_id_fkey"
              columns: ["variant_id"]
              referencedRelation: "product_variants"
              referencedColumns: ["id"]
            }
          ]
      }
      inventory_movements: {
        Row: {
          id: string
          inventory_id: string
          product_id: string
          variant_id: string | null
          purchase_option_id: string | null
          movement_type: "initial_stock" | "restock" | "sale" | "reservation" | "reservation_release" | "return" | "damaged" | "manual_adjustment" | "correction"
          previous_quantity: number
          quantity_change: number
          resulting_quantity: number
          reason: string | null
          order_id: string | null
          actor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          inventory_id: string
          product_id: string
          variant_id?: string | null
          purchase_option_id?: string | null
          movement_type: "initial_stock" | "restock" | "sale" | "reservation" | "reservation_release" | "return" | "damaged" | "manual_adjustment" | "correction"
          previous_quantity: number
          quantity_change: number
          resulting_quantity: number
          reason?: string | null
          order_id?: string | null
          actor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          inventory_id?: string
          product_id?: string
          variant_id?: string | null
          purchase_option_id?: string | null
          movement_type?: "initial_stock" | "restock" | "sale" | "reservation" | "reservation_release" | "return" | "damaged" | "manual_adjustment" | "correction"
          previous_quantity?: number
          quantity_change?: number
          resulting_quantity?: number
          reason?: string | null
          order_id?: string | null
          actor_id?: string | null
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "fk_inventory_movements_order"
              columns: ["order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "inventory_movements_actor_id_fkey"
              columns: ["actor_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "inventory_movements_inventory_id_fkey"
              columns: ["inventory_id"]
              referencedRelation: "inventory"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "inventory_movements_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "inventory_movements_purchase_option_id_fkey"
              columns: ["purchase_option_id"]
              referencedRelation: "purchase_options"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "inventory_movements_variant_id_fkey"
              columns: ["variant_id"]
              referencedRelation: "product_variants"
              referencedColumns: ["id"]
            }
          ]
      }
      inventory_reservations: {
        Row: {
          id: string
          inventory_id: string
          cart_id: string | null
          order_id: string | null
          quantity: number
          status: "active" | "released" | "consumed" | "expired"
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inventory_id: string
          cart_id?: string | null
          order_id?: string | null
          quantity: number
          status?: "active" | "released" | "consumed" | "expired"
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inventory_id?: string
          cart_id?: string | null
          order_id?: string | null
          quantity?: number
          status?: "active" | "released" | "consumed" | "expired"
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "fk_reservations_cart"
              columns: ["cart_id"]
              referencedRelation: "carts"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "fk_reservations_order"
              columns: ["order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "inventory_reservations_inventory_id_fkey"
              columns: ["inventory_id"]
              referencedRelation: "inventory"
              referencedColumns: ["id"]
            }
          ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_type: "customer" | "admin" | "system"
          sender_id: string | null
          body: string
          attachment_url: string | null
          is_internal_note: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_type: "customer" | "admin" | "system"
          sender_id?: string | null
          body: string
          attachment_url?: string | null
          is_internal_note?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_type?: "customer" | "admin" | "system"
          sender_id?: string | null
          body?: string
          attachment_url?: string | null
          is_internal_note?: boolean
          read_at?: string | null
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "messages_conversation_id_fkey"
              columns: ["conversation_id"]
              referencedRelation: "conversations"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "messages_sender_id_fkey"
              columns: ["sender_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          customer_id: string | null
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          customer_id?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          customer_id?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "newsletter_subscribers_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          purchase_option_id: string | null
          product_name_snapshot: string
          sku_snapshot: string
          variant_name_snapshot: string | null
          purchase_option_name_snapshot: string
          units_per_purchase_snapshot: number
          quantity: number
          unit_price_snapshot: number
          discount_snapshot: number
          line_total: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          variant_id?: string | null
          purchase_option_id?: string | null
          product_name_snapshot: string
          sku_snapshot: string
          variant_name_snapshot?: string | null
          purchase_option_name_snapshot: string
          units_per_purchase_snapshot: number
          quantity: number
          unit_price_snapshot: number
          discount_snapshot?: number
          line_total: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          variant_id?: string | null
          purchase_option_id?: string | null
          product_name_snapshot?: string
          sku_snapshot?: string
          variant_name_snapshot?: string | null
          purchase_option_name_snapshot?: string
          units_per_purchase_snapshot?: number
          quantity?: number
          unit_price_snapshot?: number
          discount_snapshot?: number
          line_total?: number
          metadata?: Json
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "order_items_order_id_fkey"
              columns: ["order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "order_items_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "order_items_purchase_option_id_fkey"
              columns: ["purchase_option_id"]
              referencedRelation: "purchase_options"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "order_items_variant_id_fkey"
              columns: ["variant_id"]
              referencedRelation: "product_variants"
              referencedColumns: ["id"]
            }
          ]
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          from_status: "pending_payment" | "paid" | "confirmed" | "processing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "ready_for_pickup" | "collected" | "cancelled" | "refunded" | null
          to_status: "pending_payment" | "paid" | "confirmed" | "processing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "ready_for_pickup" | "collected" | "cancelled" | "refunded"
          changed_by: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          from_status?: "pending_payment" | "paid" | "confirmed" | "processing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "ready_for_pickup" | "collected" | "cancelled" | "refunded" | null
          to_status: "pending_payment" | "paid" | "confirmed" | "processing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "ready_for_pickup" | "collected" | "cancelled" | "refunded"
          changed_by?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          from_status?: "pending_payment" | "paid" | "confirmed" | "processing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "ready_for_pickup" | "collected" | "cancelled" | "refunded" | null
          to_status?: "pending_payment" | "paid" | "confirmed" | "processing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "ready_for_pickup" | "collected" | "cancelled" | "refunded"
          changed_by?: string | null
          note?: string | null
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "order_status_history_changed_by_fkey"
              columns: ["changed_by"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "order_status_history_order_id_fkey"
              columns: ["order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            }
          ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          subtotal: number
          discount_amount: number
          delivery_fee: number
          total: number
          currency: string
          status: "pending_payment" | "paid" | "confirmed" | "processing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "ready_for_pickup" | "collected" | "cancelled" | "refunded"
          payment_status: "pending" | "successful" | "failed" | "abandoned" | "refunded"
          fulfillment_type: "delivery" | "pickup"
          delivery_zone_id: string | null
          delivery_zone_name_snapshot: string | null
          pickup_location_id: string | null
          delivery_address_snapshot: Json | null
          customer_contact_snapshot: Json | null
          coupon_id: string | null
          coupon_code_snapshot: string | null
          coupon_discount_snapshot: number | null
          delivery_provider: string | null
          tracking_number: string | null
          dispatched_at: string | null
          estimated_delivery_date: string | null
          delivered_at: string | null
          delivery_notes: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          notes: string | null
          idempotency_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id: string
          subtotal: number
          discount_amount?: number
          delivery_fee?: number
          total: number
          currency?: string
          status?: "pending_payment" | "paid" | "confirmed" | "processing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "ready_for_pickup" | "collected" | "cancelled" | "refunded"
          payment_status?: "pending" | "successful" | "failed" | "abandoned" | "refunded"
          fulfillment_type?: "delivery" | "pickup"
          delivery_zone_id?: string | null
          delivery_zone_name_snapshot?: string | null
          pickup_location_id?: string | null
          delivery_address_snapshot?: Json | null
          customer_contact_snapshot?: Json | null
          coupon_id?: string | null
          coupon_code_snapshot?: string | null
          coupon_discount_snapshot?: number | null
          delivery_provider?: string | null
          tracking_number?: string | null
          dispatched_at?: string | null
          estimated_delivery_date?: string | null
          delivered_at?: string | null
          delivery_notes?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          notes?: string | null
          idempotency_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          subtotal?: number
          discount_amount?: number
          delivery_fee?: number
          total?: number
          currency?: string
          status?: "pending_payment" | "paid" | "confirmed" | "processing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "ready_for_pickup" | "collected" | "cancelled" | "refunded"
          payment_status?: "pending" | "successful" | "failed" | "abandoned" | "refunded"
          fulfillment_type?: "delivery" | "pickup"
          delivery_zone_id?: string | null
          delivery_zone_name_snapshot?: string | null
          pickup_location_id?: string | null
          delivery_address_snapshot?: Json | null
          customer_contact_snapshot?: Json | null
          coupon_id?: string | null
          coupon_code_snapshot?: string | null
          coupon_discount_snapshot?: number | null
          delivery_provider?: string | null
          tracking_number?: string | null
          dispatched_at?: string | null
          estimated_delivery_date?: string | null
          delivered_at?: string | null
          delivery_notes?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          notes?: string | null
          idempotency_key?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "orders_coupon_id_fkey"
              columns: ["coupon_id"]
              referencedRelation: "coupons"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "orders_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "orders_delivery_zone_id_fkey"
              columns: ["delivery_zone_id"]
              referencedRelation: "delivery_zones"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "orders_pickup_location_id_fkey"
              columns: ["pickup_location_id"]
              referencedRelation: "pickup_locations"
              referencedColumns: ["id"]
            }
          ]
      }
      payments: {
        Row: {
          id: string
          order_id: string
          provider: "paystack"
          reference: string
          amount: number
          currency: string
          status: "pending" | "successful" | "failed" | "abandoned" | "refunded"
          channel: string | null
          gateway_response: string | null
          metadata: Json
          paid_at: string | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          provider?: "paystack"
          reference: string
          amount: number
          currency?: string
          status?: "pending" | "successful" | "failed" | "abandoned" | "refunded"
          channel?: string | null
          gateway_response?: string | null
          metadata?: Json
          paid_at?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          provider?: "paystack"
          reference?: string
          amount?: number
          currency?: string
          status?: "pending" | "successful" | "failed" | "abandoned" | "refunded"
          channel?: string | null
          gateway_response?: string | null
          metadata?: Json
          paid_at?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "payments_order_id_fkey"
              columns: ["order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            }
          ]
      }
      permission_areas: {
        Row: {
          key: string
          label: string
        }
        Insert: {
          key: string
          label: string
        }
        Update: {
          key?: string
          label?: string
        }
          Relationships: []
      }
      pickup_locations: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          contact_phone: string | null
          opening_hours: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city?: string
          contact_phone?: string | null
          opening_hours?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          contact_phone?: string | null
          opening_hours?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
          Relationships: []
      }
      product_categories: {
        Row: {
          product_id: string
          category_id: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          product_id: string
          category_id: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          product_id?: string
          category_id?: string
          is_primary?: boolean
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "product_categories_category_id_fkey"
              columns: ["category_id"]
              referencedRelation: "categories"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "product_categories_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            }
          ]
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          variant_id: string | null
          storage_path: string | null
          image_url: string | null
          alt_text: string | null
          is_primary: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          variant_id?: string | null
          storage_path?: string | null
          image_url?: string | null
          alt_text?: string | null
          is_primary?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          variant_id?: string | null
          storage_path?: string | null
          image_url?: string | null
          alt_text?: string | null
          is_primary?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "product_images_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "product_images_variant_id_fkey"
              columns: ["variant_id"]
              referencedRelation: "product_variants"
              referencedColumns: ["id"]
            }
          ]
      }
      product_import_errors: {
        Row: {
          id: string
          import_id: string
          row_id: string | null
          row_number: number | null
          field_name: string | null
          error_code: string
          error_message: string
          created_at: string
        }
        Insert: {
          id?: string
          import_id: string
          row_id?: string | null
          row_number?: number | null
          field_name?: string | null
          error_code: string
          error_message: string
          created_at?: string
        }
        Update: {
          id?: string
          import_id?: string
          row_id?: string | null
          row_number?: number | null
          field_name?: string | null
          error_code?: string
          error_message?: string
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "product_import_errors_import_id_fkey"
              columns: ["import_id"]
              referencedRelation: "product_imports"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "product_import_errors_row_id_fkey"
              columns: ["row_id"]
              referencedRelation: "product_import_rows"
              referencedColumns: ["id"]
            }
          ]
      }
      product_import_rows: {
        Row: {
          id: string
          import_id: string
          row_number: number
          raw_data: Json
          parsed_name: string | null
          parsed_sku: string | null
          parsed_slug: string | null
          parsed_brand: string | null
          parsed_category_path: string | null
          parsed_price: number | null
          parsed_compare_at_price: number | null
          parsed_stock_quantity: number | null
          parsed_description: string | null
          parsed_short_description: string | null
          primary_image_url: string | null
          additional_image_urls: (string)[]
          row_status: "pending" | "valid" | "draft" | "error" | "imported"
          resulting_product_id: string | null
          created_at: string
          matched_category_id: string | null
        }
        Insert: {
          id?: string
          import_id: string
          row_number: number
          raw_data: Json
          parsed_name?: string | null
          parsed_sku?: string | null
          parsed_slug?: string | null
          parsed_brand?: string | null
          parsed_category_path?: string | null
          parsed_price?: number | null
          parsed_compare_at_price?: number | null
          parsed_stock_quantity?: number | null
          parsed_description?: string | null
          parsed_short_description?: string | null
          primary_image_url?: string | null
          additional_image_urls?: (string)[]
          row_status?: "pending" | "valid" | "draft" | "error" | "imported"
          resulting_product_id?: string | null
          created_at?: string
          matched_category_id?: string | null
        }
        Update: {
          id?: string
          import_id?: string
          row_number?: number
          raw_data?: Json
          parsed_name?: string | null
          parsed_sku?: string | null
          parsed_slug?: string | null
          parsed_brand?: string | null
          parsed_category_path?: string | null
          parsed_price?: number | null
          parsed_compare_at_price?: number | null
          parsed_stock_quantity?: number | null
          parsed_description?: string | null
          parsed_short_description?: string | null
          primary_image_url?: string | null
          additional_image_urls?: (string)[]
          row_status?: "pending" | "valid" | "draft" | "error" | "imported"
          resulting_product_id?: string | null
          created_at?: string
          matched_category_id?: string | null
        }
          Relationships: [
            {
              foreignKeyName: "product_import_rows_import_id_fkey"
              columns: ["import_id"]
              referencedRelation: "product_imports"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "product_import_rows_matched_category_id_fkey"
              columns: ["matched_category_id"]
              referencedRelation: "categories"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "product_import_rows_resulting_product_id_fkey"
              columns: ["resulting_product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            }
          ]
      }
      product_imports: {
        Row: {
          id: string
          filename: string
          storage_path: string
          uploaded_by: string
          status: "pending" | "validating" | "previewed" | "importing" | "completed" | "failed"
          total_rows: number
          valid_rows: number
          invalid_rows: number
          draft_rows: number
          imported_rows: number
          failed_rows: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          filename: string
          storage_path: string
          uploaded_by: string
          status?: "pending" | "validating" | "previewed" | "importing" | "completed" | "failed"
          total_rows?: number
          valid_rows?: number
          invalid_rows?: number
          draft_rows?: number
          imported_rows?: number
          failed_rows?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          filename?: string
          storage_path?: string
          uploaded_by?: string
          status?: "pending" | "validating" | "previewed" | "importing" | "completed" | "failed"
          total_rows?: number
          valid_rows?: number
          invalid_rows?: number
          draft_rows?: number
          imported_rows?: number
          failed_rows?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "product_imports_uploaded_by_fkey"
              columns: ["uploaded_by"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      product_rating_aggregates: {
        Row: {
          product_id: string
          review_count: number
          average_rating: number
          rating_5_count: number
          rating_4_count: number
          rating_3_count: number
          rating_2_count: number
          rating_1_count: number
          updated_at: string
        }
        Insert: {
          product_id: string
          review_count?: number
          average_rating?: number
          rating_5_count?: number
          rating_4_count?: number
          rating_3_count?: number
          rating_2_count?: number
          rating_1_count?: number
          updated_at?: string
        }
        Update: {
          product_id?: string
          review_count?: number
          average_rating?: number
          rating_5_count?: number
          rating_4_count?: number
          rating_3_count?: number
          rating_2_count?: number
          rating_1_count?: number
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "product_rating_aggregates_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            }
          ]
      }
      product_recommendations: {
        Row: {
          id: string
          product_id: string
          recommended_product_id: string
          recommendation_type: "similar" | "frequently_bought_together" | "manual" | "related"
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          recommended_product_id: string
          recommendation_type: "similar" | "frequently_bought_together" | "manual" | "related"
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          recommended_product_id?: string
          recommendation_type?: "similar" | "frequently_bought_together" | "manual" | "related"
          sort_order?: number
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "product_recommendations_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "product_recommendations_recommended_product_id_fkey"
              columns: ["recommended_product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            }
          ]
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string
          name: string
          attributes: Json
          price: number
          compare_at_price: number | null
          status: "draft" | "active" | "archived" | "out_of_stock"
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          sku: string
          name: string
          attributes?: Json
          price: number
          compare_at_price?: number | null
          status?: "draft" | "active" | "archived" | "out_of_stock"
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          sku?: string
          name?: string
          attributes?: Json
          price?: number
          compare_at_price?: number | null
          status?: "draft" | "active" | "archived" | "out_of_stock"
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "product_variants_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            }
          ]
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          sku: string
          barcode: string | null
          brand_id: string | null
          short_description: string | null
          description: string | null
          status: "draft" | "active" | "archived" | "out_of_stock"
          product_type: "simple" | "variant"
          materials: string | null
          dimensions: string | null
          weight_kg: number | null
          care_instructions: string | null
          warranty_info: string | null
          specifications: Json
          features: (string)[]
          base_price: number
          compare_at_price: number | null
          is_featured: boolean
          is_new: boolean
          is_best_seller: boolean
          is_active: boolean
          search_vector: unknown | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sku: string
          barcode?: string | null
          brand_id?: string | null
          short_description?: string | null
          description?: string | null
          status?: "draft" | "active" | "archived" | "out_of_stock"
          product_type?: "simple" | "variant"
          materials?: string | null
          dimensions?: string | null
          weight_kg?: number | null
          care_instructions?: string | null
          warranty_info?: string | null
          specifications?: Json
          features?: (string)[]
          base_price: number
          compare_at_price?: number | null
          is_featured?: boolean
          is_new?: boolean
          is_best_seller?: boolean
          is_active?: boolean
          search_vector?: unknown | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sku?: string
          barcode?: string | null
          brand_id?: string | null
          short_description?: string | null
          description?: string | null
          status?: "draft" | "active" | "archived" | "out_of_stock"
          product_type?: "simple" | "variant"
          materials?: string | null
          dimensions?: string | null
          weight_kg?: number | null
          care_instructions?: string | null
          warranty_info?: string | null
          specifications?: Json
          features?: (string)[]
          base_price?: number
          compare_at_price?: number | null
          is_featured?: boolean
          is_new?: boolean
          is_best_seller?: boolean
          is_active?: boolean
          search_vector?: unknown | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "products_brand_id_fkey"
              columns: ["brand_id"]
              referencedRelation: "brands"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "products_created_by_fkey"
              columns: ["created_by"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: "customer" | "admin" | "super_admin"
          is_active: boolean
          requires_2fa: boolean
          two_factor_enabled: boolean
          marketing_opt_in: boolean
          last_sign_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: "customer" | "admin" | "super_admin"
          is_active?: boolean
          requires_2fa?: boolean
          two_factor_enabled?: boolean
          marketing_opt_in?: boolean
          last_sign_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: "customer" | "admin" | "super_admin"
          is_active?: boolean
          requires_2fa?: boolean
          two_factor_enabled?: boolean
          marketing_opt_in?: boolean
          last_sign_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: []
      }
      purchase_options: {
        Row: {
          id: string
          product_id: string
          variant_id: string | null
          name: string
          unit_type: string
          units_per_purchase: number
          price: number
          compare_at_price: number | null
          minimum_quantity: number
          maximum_quantity: number | null
          quantity_step: number
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          variant_id?: string | null
          name: string
          unit_type: string
          units_per_purchase: number
          price: number
          compare_at_price?: number | null
          minimum_quantity?: number
          maximum_quantity?: number | null
          quantity_step?: number
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          variant_id?: string | null
          name?: string
          unit_type?: string
          units_per_purchase?: number
          price?: number
          compare_at_price?: number | null
          minimum_quantity?: number
          maximum_quantity?: number | null
          quantity_step?: number
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "purchase_options_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "purchase_options_variant_id_fkey"
              columns: ["variant_id"]
              referencedRelation: "product_variants"
              referencedColumns: ["id"]
            }
          ]
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          customer_id: string
          order_id: string
          order_item_id: string
          rating: number
          title: string | null
          body: string | null
          status: "pending" | "approved" | "hidden" | "flagged"
          is_verified_purchase: boolean
          moderated_by: string | null
          moderated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          customer_id: string
          order_id: string
          order_item_id: string
          rating: number
          title?: string | null
          body?: string | null
          status?: "pending" | "approved" | "hidden" | "flagged"
          is_verified_purchase?: boolean
          moderated_by?: string | null
          moderated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          customer_id?: string
          order_id?: string
          order_item_id?: string
          rating?: number
          title?: string | null
          body?: string | null
          status?: "pending" | "approved" | "hidden" | "flagged"
          is_verified_purchase?: boolean
          moderated_by?: string | null
          moderated_at?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "reviews_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "reviews_moderated_by_fkey"
              columns: ["moderated_by"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "reviews_order_id_fkey"
              columns: ["order_id"]
              referencedRelation: "orders"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "reviews_order_item_id_fkey"
              columns: ["order_item_id"]
              referencedRelation: "order_items"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "reviews_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            }
          ]
      }
      saved_products: {
        Row: {
          id: string
          customer_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          product_id?: string
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "saved_products_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "saved_products_product_id_fkey"
              columns: ["product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            }
          ]
      }
      search_logs: {
        Row: {
          id: string
          session_id: string | null
          customer_id: string | null
          query: string
          normalized_query: string | null
          result_count: number
          clicked_product_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          customer_id?: string | null
          query: string
          normalized_query?: string | null
          result_count?: number
          clicked_product_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          customer_id?: string | null
          query?: string
          normalized_query?: string | null
          result_count?: number
          clicked_product_id?: string | null
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "search_logs_clicked_product_id_fkey"
              columns: ["clicked_product_id"]
              referencedRelation: "products"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "search_logs_customer_id_fkey"
              columns: ["customer_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
    }
    Views: {
      abandoned_cart_summary: {
        Row: {
          cart_id: string | null
          customer_id: string | null
          last_activity_at: string | null
          item_count: number | null
          cart_value: number | null
        }
          Relationships: []
      }
      banner_performance: {
        Row: {
          banner_id: string | null
          title: string | null
          impressions: number | null
          clicks: number | null
          click_through_rate_pct: number | null
        }
          Relationships: []
      }
      campaign_summary: {
        Row: {
          campaign_id: string | null
          name: string | null
          product_count: number | null
          orders: number | null
          revenue: number | null
        }
          Relationships: []
      }
      category_performance: {
        Row: {
          category_id: string | null
          name: string | null
          parent_id: string | null
          orders: number | null
          units_sold: number | null
          revenue: number | null
          avg_line_value: number | null
        }
          Relationships: []
      }
      customer_summary: {
        Row: {
          customer_id: string | null
          full_name: string | null
          email: string | null
          completed_orders: number | null
          lifetime_spend: number | null
          avg_order_value: number | null
          first_order_at: string | null
          last_order_at: string | null
          is_returning: boolean | null
        }
          Relationships: []
      }
      daily_sales_summary: {
        Row: {
          sales_date: string | null
          order_count: number | null
          completed_orders: number | null
          cancelled_orders: number | null
          revenue: number | null
          delivery_revenue: number | null
          total_discount: number | null
          average_order_value: number | null
        }
          Relationships: []
      }
      delivery_summary: {
        Row: {
          zone_id: string | null
          zone_name: string | null
          order_count: number | null
          delivery_revenue: number | null
          free_delivery_orders: number | null
          avg_delivery_fee: number | null
          delivered_orders: number | null
          cancelled_orders: number | null
        }
          Relationships: []
      }
      inventory_available: {
        Row: {
          id: string | null
          product_id: string | null
          variant_id: string | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          quantity_available: number | null
          low_stock_threshold: number | null
          is_low_stock: boolean | null
          is_out_of_stock: boolean | null
        }
          Relationships: []
      }
      inventory_summary: {
        Row: {
          product_id: string | null
          name: string | null
          sku: string | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          quantity_available: number | null
          low_stock_threshold: number | null
          is_low_stock: boolean | null
          is_out_of_stock: boolean | null
          stock_value: number | null
        }
          Relationships: []
      }
      marketing_attribution: {
        Row: {
          utm_source: string | null
          utm_campaign: string | null
          sessions: number | null
          product_views: number | null
          add_to_carts: number | null
          orders: number | null
        }
          Relationships: []
      }
      monthly_sales_summary: {
        Row: {
          sales_month: string | null
          order_count: number | null
          revenue: number | null
          delivery_revenue: number | null
          total_discount: number | null
          average_order_value: number | null
          unique_customers: number | null
        }
          Relationships: []
      }
      product_performance: {
        Row: {
          product_id: string | null
          name: string | null
          sku: string | null
          brand_name: string | null
          status: "draft" | "active" | "archived" | "out_of_stock" | null
          units_sold: number | null
          revenue: number | null
          views: number | null
          saves: number | null
          add_to_cart_count: number | null
          conversion_rate_pct: number | null
          average_rating: number | null
          review_count: number | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          quantity_available: number | null
        }
          Relationships: []
      }
      product_stock_badge: {
        Row: {
          product_id: string | null
          variant_id: string | null
          stock_label: string | null
          low_stock_count_if_applicable: number | null
        }
          Relationships: []
      }
      sales_funnel: {
        Row: {
          product_views: number | null
          add_to_carts: number | null
          checkouts_started: number | null
          payments_started: number | null
          payments_successful: number | null
          orders_created: number | null
        }
          Relationships: []
      }
      search_demand_gaps: {
        Row: {
          normalized_query: string | null
          search_count: number | null
          last_searched_at: string | null
        }
          Relationships: []
      }
    }
    Functions: {
      // 195 functions available: admin_add_purchase_option, admin_seed_product, armor, armor, crypt, current_role_is, dearmor, decrypt, decrypt_iv, digest, digest, encrypt, encrypt_iv, enforce_category_depth, enforce_product_activation_requirements, enforce_purchase_option_variant_matches_product, enforce_review_eligibility, enforce_single_default_address, fn_available_stock, fn_calculate_delivery_fee, fn_compute_coupon_discount, fn_consume_reservation, fn_create_order_from_cart, fn_process_payment_failure, fn_process_payment_success, fn_record_inventory_movement, fn_release_expired_reservations, fn_release_reservation, fn_reserve_inventory, fn_submit_review, fn_units_required, fn_validate_coupon, fn_validate_purchase_quantity, gen_random_bytes, gen_random_uuid, gen_salt, gen_salt, generate_order_number, gin_btree_consistent, gin_compare_prefix_anyenum, gin_compare_prefix_bit, gin_compare_prefix_bool, gin_compare_prefix_bpchar, gin_compare_prefix_bytea, gin_compare_prefix_char, gin_compare_prefix_cidr, gin_compare_prefix_date, gin_compare_prefix_float4, gin_compare_prefix_float8, gin_compare_prefix_inet, gin_compare_prefix_int2, gin_compare_prefix_int4, gin_compare_prefix_int8, gin_compare_prefix_interval, gin_compare_prefix_macaddr, gin_compare_prefix_macaddr8, gin_compare_prefix_money, gin_compare_prefix_name, gin_compare_prefix_numeric, gin_compare_prefix_oid, gin_compare_prefix_text, gin_compare_prefix_time, gin_compare_prefix_timestamp, gin_compare_prefix_timestamptz, gin_compare_prefix_timetz, gin_compare_prefix_uuid, gin_compare_prefix_varbit, gin_enum_cmp, gin_extract_query_anyenum, gin_extract_query_bit, gin_extract_query_bool, gin_extract_query_bpchar, gin_extract_query_bytea, gin_extract_query_char, gin_extract_query_cidr, gin_extract_query_date, gin_extract_query_float4, gin_extract_query_float8, gin_extract_query_inet, gin_extract_query_int2, gin_extract_query_int4, gin_extract_query_int8, gin_extract_query_interval, gin_extract_query_macaddr, gin_extract_query_macaddr8, gin_extract_query_money, gin_extract_query_name, gin_extract_query_numeric, gin_extract_query_oid, gin_extract_query_text, gin_extract_query_time, gin_extract_query_timestamp, gin_extract_query_timestamptz, gin_extract_query_timetz, gin_extract_query_trgm, gin_extract_query_uuid, gin_extract_query_varbit, gin_extract_value_anyenum, gin_extract_value_bit, gin_extract_value_bool, gin_extract_value_bpchar, gin_extract_value_bytea, gin_extract_value_char, gin_extract_value_cidr, gin_extract_value_date, gin_extract_value_float4, gin_extract_value_float8, gin_extract_value_inet, gin_extract_value_int2, gin_extract_value_int4, gin_extract_value_int8, gin_extract_value_interval, gin_extract_value_macaddr, gin_extract_value_macaddr8, gin_extract_value_money, gin_extract_value_name, gin_extract_value_numeric, gin_extract_value_oid, gin_extract_value_text, gin_extract_value_time, gin_extract_value_timestamp, gin_extract_value_timestamptz, gin_extract_value_timetz, gin_extract_value_trgm, gin_extract_value_uuid, gin_extract_value_varbit, gin_numeric_cmp, gin_trgm_consistent, gin_trgm_triconsistent, gtrgm_compress, gtrgm_consistent, gtrgm_decompress, gtrgm_distance, gtrgm_in, gtrgm_options, gtrgm_out, gtrgm_penalty, gtrgm_picksplit, gtrgm_same, gtrgm_union, handle_new_auth_user, has_permission, hmac, hmac, is_admin, is_super_admin, log_order_status_change, pgp_armor_headers, pgp_key_id, pgp_pub_decrypt, pgp_pub_decrypt, pgp_pub_decrypt, pgp_pub_decrypt_bytea, pgp_pub_decrypt_bytea, pgp_pub_decrypt_bytea, pgp_pub_encrypt, pgp_pub_encrypt, pgp_pub_encrypt_bytea, pgp_pub_encrypt_bytea, pgp_sym_decrypt, pgp_sym_decrypt, pgp_sym_decrypt_bytea, pgp_sym_decrypt_bytea, pgp_sym_encrypt, pgp_sym_encrypt, pgp_sym_encrypt_bytea, pgp_sym_encrypt_bytea, products_update_search_vector, raise_app_error, refresh_product_rating_aggregate, search_suggestions, set_limit, set_updated_at, show_limit, show_trgm, similarity, similarity_dist, similarity_op, slugify, strict_word_similarity, strict_word_similarity_commutator_op, strict_word_similarity_dist_commutator_op, strict_word_similarity_dist_op, strict_word_similarity_op, touch_conversation_on_message, trg_reviews_refresh_aggregate, unaccent, unaccent, unaccent_init, unaccent_lexize, word_similarity, word_similarity_commutator_op, word_similarity_dist_commutator_op, word_similarity_dist_op, word_similarity_op
      // Param/return shapes are defined explicitly per call site in src/services/*
      // against the authoritative SQL in migrations/015_functions_business_logic.sql
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      analytics_event_type: "product_view" | "category_view" | "search" | "search_result_click" | "banner_view" | "banner_click" | "add_to_cart" | "remove_from_cart" | "save_product" | "unsave_product" | "checkout_started" | "payment_started" | "payment_success" | "payment_failed" | "order_created" | "order_delivered" | "review_created"
      banner_destination_type: "category" | "campaign" | "product" | "external_url" | "none"
      conversation_category: "support" | "order" | "delivery" | "payment" | "general"
      conversation_status: "open" | "pending" | "closed"
      coupon_type: "percentage" | "fixed" | "free_delivery"
      discount_type: "percentage" | "fixed"
      email_status: "queued" | "sent" | "failed" | "bounced"
      email_type: "welcome" | "order_confirmation" | "payment_confirmation" | "order_processing" | "order_dispatched" | "order_delivered" | "password_reset" | "security_alert" | "review_reminder" | "newsletter" | "admin_alert"
      fulfillment_type: "delivery" | "pickup"
      import_row_status: "pending" | "valid" | "draft" | "error" | "imported"
      import_status: "pending" | "validating" | "previewed" | "importing" | "completed" | "failed"
      inventory_movement_type: "initial_stock" | "restock" | "sale" | "reservation" | "reservation_release" | "return" | "damaged" | "manual_adjustment" | "correction"
      message_sender_type: "customer" | "admin" | "system"
      order_status: "pending_payment" | "paid" | "confirmed" | "processing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "ready_for_pickup" | "collected" | "cancelled" | "refunded"
      payment_provider: "paystack"
      payment_status: "pending" | "successful" | "failed" | "abandoned" | "refunded"
      product_status: "draft" | "active" | "archived" | "out_of_stock"
      product_type: "simple" | "variant"
      recommendation_type: "similar" | "frequently_bought_together" | "manual" | "related"
      reservation_status: "active" | "released" | "consumed" | "expired"
      review_status: "pending" | "approved" | "hidden" | "flagged"
      user_role: "customer" | "admin" | "super_admin"
    }
  }
}

