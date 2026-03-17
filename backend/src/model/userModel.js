import supabase from '../config/supabase.js';

export const fetchAll = async () => {
    return await supabase.from('users').select('*');
}

export const create = async (name, email, password) => {
    return await supabase.from('users').insert({ name, email, password }).select();
}