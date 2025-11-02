import { supabase } from './supabase';

export const checkAuth = () => {
  const userData = localStorage.getItem('vaxsync_user');
  if (!userData) {
    return null;
  }
  return JSON.parse(userData);
};

export const requireAuth = () => {
  const user = checkAuth();
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  return user;
};

export const getUserProfile = async (userId) => {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      barangays:assigned_barangay_id (
        id,
        name,
        municipality,
        health_center_name
      )
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return profile;
};

export const logout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('vaxsync_user');
  window.location.href = '/login';
};