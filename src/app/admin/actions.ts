'use server';

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Database } from "@/lib/database.types";

type Transaction = Database['public']['Tables']['transactions']['Row'];

export async function getTransactionsForEvent(eventId: string): Promise<Transaction[]> {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('event_id', eventId);
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data;
}
