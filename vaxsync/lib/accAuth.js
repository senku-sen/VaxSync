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
  try {
    console.log('Fetching user profile...');
    
    // Fetch user profile first
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (!profile) {
      console.warn('No profile found for user:', userId);
      return null;
    }

    // If user has assigned_barangay_id, fetch barangay details separately
    if (profile.assigned_barangay_id) {
      console.log('Fetching barangay for ID:', profile.assigned_barangay_id);
      const { data: barangay, error: barangayError } = await supabase
        .from('barangays')
        .select('id, name, municipality, population')
        .eq('id', profile.assigned_barangay_id)
        .single();

      if (!barangayError && barangay) {
        profile.barangays = barangay;
        console.log('Barangay fetched successfully:', barangay.name);
      } else if (barangayError) {
        console.warn('Could not fetch barangay:', barangayError.message);
      }
    }

    console.log('User profile fetched successfully');
    return profile;
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    return null;
  }
};

export const logout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('vaxsync_user');
  window.location.href = '/pages/signin';
};