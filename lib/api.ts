import { supabase } from './supabase';
import { 
  Profile, NGO, Campaign, Donation, Expenditure, 
  ImpactAttribution, CampaignWithDetails 
} from './types';

// Profile operations
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Profile;
}

// NGO operations
export async function getNGOs() {
  const { data, error } = await supabase
    .from('ngos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as NGO[];
}

export async function getNGO(ngoId: string) {
  const { data, error } = await supabase
    .from('ngos')
    .select('*')
    .eq('id', ngoId)
    .single();
  
  if (error) throw error;
  return data as NGO;
}

export async function createNGO(ngo: Omit<NGO, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('ngos')
    .insert([ngo])
    .select()
    .single();
  
  if (error) throw error;
  return data as NGO;
}

// Campaign operations
export async function getCampaigns(ngoId?: string) {
  let query = supabase.from('campaigns').select(`
    *,
    ngo:ngos(*),
    donations(amount)
  `);
  
  if (ngoId) {
    query = query.eq('ngo_id', ngoId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as CampaignWithDetails[];
}

export async function getCampaign(campaignId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      ngo:ngos(*),
      donations(amount),
      expenditures(*)
    `)
    .eq('id', campaignId)
    .single();
  
  if (error) throw error;
  return data as CampaignWithDetails;
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'collected_amount'>) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([{ ...campaign, collected_amount: 0 }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Campaign;
}

// Donation operations
export async function createDonation(donation: Omit<Donation, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('donations')
    .insert([donation])
    .select()
    .single();
  
  if (error) throw error;
  
  // Update campaign collected amount
  await updateCampaignCollectedAmount(donation.campaign_id);
  
  return data as Donation;
}

export async function getDonations(donorId?: string, campaignId?: string) {
  let query = supabase.from('donations').select(`
    *,
    campaign:campaigns(*),
    donor:profiles(*)
  `);
  
  if (donorId) query = query.eq('donor_id', donorId);
  if (campaignId) query = query.eq('campaign_id', campaignId);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Donation[];
}

// Expenditure operations
export async function createExpenditure(expenditure: Omit<Expenditure, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('expenditures')
    .insert([expenditure])
    .select()
    .single();
  
  if (error) throw error;

  // Recalculate campaign balance: donations - expenditures
  await updateCampaignCollectedAmount(expenditure.campaign_id);

  return data as Expenditure;
}

export async function getExpenditures(campaignId: string) {
  const { data, error } = await supabase
    .from('expenditures')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Expenditure[];
}

// Impact Attribution operations
export async function createImpactAttribution(attribution: Omit<ImpactAttribution, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('impact_attributions')
    .insert([attribution])
    .select()
    .single();
  
  if (error) throw error;
  return data as ImpactAttribution;
}

export async function getDonationAttributions(donationId: string) {
  const { data, error } = await supabase
    .from('impact_attributions')
    .select(`
      *,
      expenditure:expenditures(*)
    `)
    .eq('donation_id', donationId);
  
  if (error) throw error;
  return data as ImpactAttribution[];
}

// Helper function to update campaign collected amount (donations - expenditures)
async function updateCampaignCollectedAmount(campaignId: string) {
  const { data: donationData, error: donationError } = await supabase
    .from('donations')
    .select('amount')
    .eq('campaign_id', campaignId)
    .eq('status', 'completed');

  if (donationError) return;

  const totalDonations = donationData?.reduce((sum, d) => sum + d.amount, 0) || 0;

  const { data: expenditureData, error: expenditureError } = await supabase
    .from('expenditures')
    .select('amount')
    .eq('campaign_id', campaignId);

  if (expenditureError) return;

  const totalExpenditures = expenditureData?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const availableBalance = Math.max(totalDonations - totalExpenditures, 0);

  await supabase
    .from('campaigns')
    .update({ collected_amount: availableBalance })
    .eq('id', campaignId);
}

// Search and filter operations
export async function searchCampaigns(query: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      ngo:ngos(*)
    `)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('status', 'active');
  
  if (error) throw error;
  return data as CampaignWithDetails[];
}

export async function getPublicLedger(ngoId?: string) {
  let query = supabase
    .from('donations')
    .select(`
      id,
      amount,
      created_at,
      donor:profiles(full_name),
      campaign:campaigns(title, ngo_id, ngo:ngos(name))
    `)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;

  // Filter client-side by ngo_id when scoping to a specific NGO
  let result = data as any[];
  if (ngoId) {
    result = result.filter((entry) => entry.campaign?.ngo_id === ngoId);
  }

  return result;
}
