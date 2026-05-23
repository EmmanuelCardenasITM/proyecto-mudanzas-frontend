import api from './api';

export const usuarioService = {
  // Obtener todos los usuarios
  getAll: async () => {
    const response = await api.get('/usuarios');
    // Adaptamos la respuesta del backend
    return response.data.data || response.data;
  },

  // Obtener usuario por ID
  getById: async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data.data || response.data;
  },

  // Crear usuario
  create: async (userData) => {
    const response = await api.post('/usuarios', userData);
    return response.data.data || response.data;
  },

  // Actualizar usuario
  update: async (id, userData) => {
    const response = await api.put(`/usuarios/${id}`, userData);
    return response.data.data || response.data;
  },

  // Eliminar usuario
  delete: async (id) => {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data.data || response.data;
  },
};
