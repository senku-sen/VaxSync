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
    console.log('Fetching user profile with barangay...');
    
    // Fetch user profile with barangay in a single query
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        barangays:assigned_barangay_id (
          id,
          name,
          municipality,
          population
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
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