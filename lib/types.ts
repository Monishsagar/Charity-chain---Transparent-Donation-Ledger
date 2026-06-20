export type UserRole = 'donor' | 'ngo' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface NGO {
  id: string;
  user_id: string;
  name: string;
  description: string;
  mission: string;
  logo_url?: string;
  website?: string;
  verified: boolean;
  verification_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  ngo_id: string;
  title: string;
  description: string;
  goal_amount: number;
  collected_amount: number;
  category: string;
  status: 'active' | 'completed' | 'paused';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  campaign_id: string;
  donor_id: string;
  amount: number;
  currency: 'INR';
  status: 'pending' | 'completed' | 'failed';
  payment_method: 'upi' | 'card' | 'bank';
  transaction_id?: string;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface Expenditure {
  id: string;
  campaign_id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  proof_urls: string[];
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImpactAttribution {
  id: string;
  donation_id: string;
  expenditure_id: string;
  attributed_amount: number;
  impact_metric: string;
  created_at: string;
}

export interface DonationWithDetails extends Donation {
  campaign?: Campaign;
  donor?: Profile;
  attributions?: ImpactAttribution[];
}

export interface CampaignWithDetails extends Campaign {
  ngo?: NGO;
  donations?: Donation[];
  expenditures?: Expenditure[];
  collected_amount?: number;
}
