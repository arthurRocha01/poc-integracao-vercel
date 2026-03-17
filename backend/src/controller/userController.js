import * as userModel from '../model/userModel.js'

export const fetchAll = async (req, res) => {
    const { data, error } = await userModel.fetchAll();

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
}

export const create = async (req, res) => {
    const { name, email, password } = req.body;
    const { error, data } = await userModel.create(name, email, password);

    if (error) {
        return res.status(400).json({ error: error.message});
    }

    res.json(data);
}