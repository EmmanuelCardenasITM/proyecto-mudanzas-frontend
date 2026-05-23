import api from './api';

export const tarifaService = {
  // Obtener todas las tarifas
  getAll: async () => {
    const response = await api.get('/tarifas');
    return response.data.data || response.data;
  },

  // Actualizar tarifas
  update: async (tarifaData) => {
    const response = await api.put('/tarifas', tarifaData);
    return response.data.data || response.data;
  },

  // Actualizar tarifas con PATCH (alternativa)
  updatePatch: async (tarifaData) => {
    const response = await api.patch('/tarifas', tarifaData);
    return response.data.data || response.data;
  },
};
