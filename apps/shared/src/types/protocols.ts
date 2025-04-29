export interface ProtocolAttribute {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: 'age' | 'email' | 'events' | 'gender' | 'residency' | 'income' | 'ethereum_staker' | 'attestation' | 'followers';
  is_active: boolean;
  icon?: string; // This is from the mocks but might not be in the DB
}

export interface Protocol {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  protocol_attribute_id: string | null;
  created_at: string;
  updated_at: string | null;
  protocol_attributes?: ProtocolAttribute;
}

export interface UserProtocol {
  id: string;
  user_id: string;
  protocol_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string | null;
  verified_at: string | null;
  deleted_at: string | null;
  protocols?: Protocol;
} 