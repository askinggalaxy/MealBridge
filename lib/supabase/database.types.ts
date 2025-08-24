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
      profiles: {
        Row: {
          id: string
          display_name: string
          role: 'donor' | 'recipient' | 'ngo' | 'admin'
          bio: string | null
          location_lat: number | null
          location_lng: number | null
          neighborhood: string | null
          phone: string | null
          avatar_url: string | null
          reputation_score: number
          reputation_count: number
          is_verified: boolean
          is_banned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          role?: 'donor' | 'recipient' | 'ngo' | 'admin'
          bio?: string | null
          location_lat?: number | null
          location_lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          avatar_url?: string | null
          reputation_score?: number
          reputation_count?: number
          is_verified?: boolean
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          role?: 'donor' | 'recipient' | 'ngo' | 'admin'
          bio?: string | null
          location_lat?: number | null
          location_lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          avatar_url?: string | null
          reputation_score?: number
          reputation_count?: number
          is_verified?: boolean
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      donations: {
        Row: {
          id: string
          donor_id: string
          title: string
          description: string
          category_id: string
          quantity: string
          expiry_date: string
          pickup_window_start: string
          pickup_window_end: string
          condition: 'sealed' | 'open'
          storage_type: 'ambient' | 'refrigerated' | 'frozen'
          location_lat: number
          location_lng: number
          address_text: string
          status: 'available' | 'reserved' | 'picked_up' | 'canceled' | 'expired'
          images: string[]
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          donor_id: string
          title: string
          description: string
          category_id: string
          quantity: string
          expiry_date: string
          pickup_window_start: string
          pickup_window_end: string
          condition?: 'sealed' | 'open'
          storage_type?: 'ambient' | 'refrigerated' | 'frozen'
          location_lat: number
          location_lng: number
          address_text: string
          status?: 'available' | 'reserved' | 'picked_up' | 'canceled' | 'expired'
          images?: string[]
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          donor_id?: string
          title?: string
          description?: string
          category_id?: string
          quantity?: string
          expiry_date?: string
          pickup_window_start?: string
          pickup_window_end?: string
          condition?: 'sealed' | 'open'
          storage_type?: 'ambient' | 'refrigerated' | 'frozen'
          location_lat?: number
          location_lng?: number
          address_text?: string
          status?: 'available' | 'reserved' | 'picked_up' | 'canceled' | 'expired'
          images?: string[]
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          donation_id: string
          recipient_id: string
          status: 'pending' | 'accepted' | 'declined' | 'completed' | 'canceled'
          message: string | null
          pickup_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          donation_id: string
          recipient_id: string
          status?: 'pending' | 'accepted' | 'declined' | 'completed' | 'canceled'
          message?: string | null
          pickup_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          donation_id?: string
          recipient_id?: string
          status?: 'pending' | 'accepted' | 'declined' | 'completed' | 'canceled'
          message?: string | null
          pickup_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          donation_id: string
          sender_id: string
          recipient_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          donation_id: string
          sender_id: string
          recipient_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          donation_id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          donation_id: string
          rater_id: string
          rated_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          donation_id: string
          rater_id: string
          rated_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          donation_id?: string
          rater_id?: string
          rated_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          is_read: boolean
          is_email_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          is_read?: boolean
          is_email_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean
          is_email_sent?: boolean
          created_at?: string
        }
      }
      flags: {
        Row: {
          id: string
          reporter_id: string
          target_type: 'donation' | 'user'
          target_id: string
          reason: 'safety' | 'expired' | 'suspect' | 'spam' | 'inappropriate'
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved'
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_type: 'donation' | 'user'
          target_id: string
          reason: 'safety' | 'expired' | 'suspect' | 'spam' | 'inappropriate'
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          target_type?: 'donation' | 'user'
          target_id?: string
          reason?: 'safety' | 'expired' | 'suspect' | 'spam' | 'inappropriate'
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: {
          lat1: number
          lng1: number
          lat2: number
          lng2: number
        }
        Returns: number
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