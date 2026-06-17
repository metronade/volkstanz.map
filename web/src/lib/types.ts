export type Locale = 'de' | 'en';

export interface GroupTranslation {
  lang: Locale;
  description_md?: string | null;
  rehearsal_times?: string | null;
}

export interface GroupContact {
  type: 'website' | 'facebook' | 'instagram' | 'youtube' | 'mastodon' | 'other';
  label?: string | null;
  value: string;
}

export interface GroupImage {
  asset_id: string;
  kind: 'hero' | 'logo' | 'team' | 'gallery';
  alt_text_de?: string | null;
  alt_text_en?: string | null;
  is_primary: boolean;
}

export interface Group {
  id: string;
  slug: string;
  name: string;
  founded_year?: number | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  region?: string | null;
  country: string;
  privacy_level: 'exact' | 'neighborhood' | 'city' | 'region';
  translations?: GroupTranslation[];
  contacts?: GroupContact[];
  images?: GroupImage[];
  published_at?: string | null;
  // GeoJSON-relevant
  lat?: number;
  lng?: number;
}
