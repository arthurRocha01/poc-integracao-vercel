import supabase from '../config/supabase.js';

const fetchAll = async () => {
    return await supabase.from('users').select('*');
}

const create = async (name, email, password) => {
    return await supabase.from('users').insert({ name, email, password }).select();
}