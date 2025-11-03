import { supabase } from './supabase';

export const checkAuth = () => {
  const userData = localStorage.getItem('vaxsync_user');
  if (!userData) {
    return null;
  }
  try {
    const parsed = JSON.parse(userData);
    if (parsed && typeof parsed === 'object' && parsed.id && parsed.email) {
      return parsed;
    }
  } catch (e) {
    console.warn('Invalid vaxsync_user in localStorage, clearing.', e);
  }
  // Clear corrupted/invalid cache and treat as logged out
  localStorage.removeItem('vaxsync_user');
  return null;
};

export const requireAuth = () => {
  const user = checkAuth();
  console.log('requireAuth called, user:', user);
  if (!user) {
    console.warn('No user found, redirecting to /pages/signin');
    window.location.href = '/pages/signin';
    return null;
  }
  return user;
};

export const getUserProfile = async (userId) => {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  // If profile has assigned_barangay_id, fetch barangay separately
  if (profile && profile.assigned_barangay_id) {
    const { data: barangay, error: barangayError } = await supabase
      .from('barangays')
      .select('id, name, municipality, health_center_name')
      .eq('id', profile.assigned_barangay_id)
      .single();

    if (!barangayError && barangay) {
      profile.barangays = barangay;
    }
  }

  return profile;
};

export const logout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('vaxsync_user');
  window.location.href = '/pages/signin';
};