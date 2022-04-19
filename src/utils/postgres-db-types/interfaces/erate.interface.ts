export interface Users {
  user_id: string;
  email: string;
  name: string;
  password: string;
  phone: string;
  favourite_currency_pairs: [string, string][];
  created_at: number;
  verified_at: number;
  wallet_id: string;
}

export interface ParallelRates {
  time: number;
  rate: number;
  currency_id: string;
}

export interface BlackRates {
  seller_id: string;
  rate: number;
  base: string;
  quota: string;
}

export interface Currencies {
  currency_id: string;
  full_name: string;
}
