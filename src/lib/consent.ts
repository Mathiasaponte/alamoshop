import { supabase } from '@/integrations/supabase/client';
import { PRIVACY_VERSION, TERMS_VERSION } from './legal';

export async function hasCurrentConsent(uid: string) {
  const { data, error } = await supabase.from('consents').select('id').eq('user_id', uid).eq('terms_version', TERMS_VERSION).eq('privacy_version', PRIVACY_VERSION).maybeSingle();
  if (error) throw error;
  return !!data;
}
export async function acceptCurrentConsent() {
  const { error } = await supabase.rpc('accept_current_consent');
  if (error) throw error;
}