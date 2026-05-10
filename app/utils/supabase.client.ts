import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our table
export type ExchangeRequest = {
  id: number
  shopify_order_id: string
  original_order_name: string | null
  customer_email: string
  original_product_title: string | null
  original_variant_id: string | null
  new_product_id: string
  new_variant_id: string
  new_product_title: string | null
  new_variant_title: string | null
  status: 'pending' | 'approved' | 'rejected'
  draft_order_id: string | null
  return_label_url: string | null
  created_at: string
  approved_at: string | null
}
