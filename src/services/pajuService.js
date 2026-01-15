
import { supabase } from '../lib/supabase';

// === USERS ===

/**
 * Get full profile of a user by ID or Username
 */
export const getUserProfile = async (userId) => {
     const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

     if (error) throw error;
     return data;
};

/**
 * Update user's 'kong' (beans/credit)
 */
export const updateUserBeans = async (userId, newAmount) => {
     const { data, error } = await supabase
          .from('profiles')
          .update({ beans: newAmount })
          .eq('id', userId);

     if (error) throw error;
     return data;
};

// === POSTS (Market & Community) ===

/**
 * Fetch feed posts with optional filters
 */
export const getPosts = async (type = null) => {
     let query = supabase
          .from('posts')
          .select(`
      *,
      profiles:author_id (username, avatar_url, location)
    `)
          .order('created_at', { ascending: false });

     if (type) {
          query = query.eq('type', type);
     }

     const { data, error } = await query;
     if (error) throw error;
     return data;
};

/**
 * Create a new post
 */
export const createPost = async (postData) => {
     const { data, error } = await supabase
          .from('posts')
          .insert([postData])
          .select();

     if (error) throw error;
     return data;
};

// === GUESTBOOK ===

export const getGuestbookEntries = async (hostId) => {
     const { data, error } = await supabase
          .from('guestbook_entries')
          .select(`
      *,
      author:author_id (username, avatar_url)
    `)
          .eq('host_id', hostId)
          .order('created_at', { ascending: false });

     if (error) throw error;
     return data;
};

export const addGuestbookEntry = async (hostId, authorId, content) => {
     const { data, error } = await supabase
          .from('guestbook_entries')
          .insert([{
               host_id: hostId,
               author_id: authorId,
               content: content
          }])
          .select();

     if (error) throw error;
     return data;
};

// === SCHOOL ===

export const searchSchoolAlumni = async (schoolName, year) => {
     // Find school ID first
     const { data: schoolData } = await supabase
          .from('schools')
          .select('id')
          .eq('name', schoolName)
          .single();

     if (!schoolData) return [];

     // Find alumni
     const { data, error } = await supabase
          .from('school_alumni')
          .select(`
      *,
      profiles:user_id (full_name, avatar_url, status_message)
    `)
          .eq('school_id', schoolData.id)
          .eq('grad_year', year);

     if (error) throw error;
     return data;
};
