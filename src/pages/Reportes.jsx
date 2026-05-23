import { useState, useEffect } from 'react';
import { servicioService } from '../services/servicioService';
import { pagoService } from '../services/pagoService';
import { clienteService } from '../services/clienteService';
import { vehiculoService } from '../services/vehiculoService';
import './Reportes.css';

const Reportes = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState({
    totalServicios: 0,
    serviciosPendientes: 0,
    serviciosEnProceso: 0,
    serviciosCompletados: 0,
    serviciosCancelados: 0,
    totalClientes: 0,
    totalVehiculos: 0,
    vehiculosDisponibles: 0,
    totalPagos: 0,
    ingresosTotales: 0,
  });

  useEffect(() => {
    console.log('Reportes component mounted - cargando estadísticas...');
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);

      // Cargar todos los datos
      const [serviciosData, pagosData, clientesData, vehiculosData] = await Promise.all([
        servicioService.getAll().catch(() => []),
        pagoService.getAll().catch(() => []),
        clienteService.getAll().catch(() => []),
        vehiculoService.getAll().catch(() => []),
      ]);

      const servicios = Array.isArray(serviciosData) ? serviciosData : [];
      const pagos = Array.isArray(pagosData) ? pagosData : [];
      const clientes = Array.isArray(clientesData) ? clientesData : [];
      const vehiculos = Array.isArray(vehiculosData) ? vehiculosData : [];

      // Calcular estadísticas de servicios
      const serviciosPorEstado = servicios.reduce((acc, servicio) => {
        const estado = (servicio.estado || 'pendiente').toLowerCase();
        console.log(`Servicio ID ${servicio.id}: estado = "${servicio.estado}" -> normalizado = "${estado}"`);
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {});

      console.log('Servicios cargados:', servicios);
      console.log('Servicios por estado:', serviciosPorEstado);

      // Calcular ingresos totales
      const ingresosTotales = pagos.reduce((total, pago) => {
        return total + (parseFloat(pago.monto) || 0);
      }, 0);

      // Contar vehículos disponibles
      const vehiculosDisponibles = vehiculos.filter(v => v.disponible === true).length;

      // Sumar estados confirmados a pendientes para el reporte
      const pendientesYConfirmados = (serviciosPorEstado.pendiente || 0) + (serviciosPorEstado.confirmado || 0);

      setEstadisticas({
        totalServicios: servicios.length,
        serviciosPendientes: pendientesYConfirmados,
        serviciosEnProceso: serviciosPorEstado.en_proceso || 0,
        serviciosCompletados: (serviciosPorEstado.completado || 0) + (serviciosPorEstado.finalizado || 0),
        serviciosCancelados: serviciosPorEstado.cancelado || 0,
        totalClientes: clientes.length,
        totalVehiculos: vehiculos.length,
        vehiculosDisponibles: vehiculosDisponibles,
        totalPagos: pagos.length,
        ingresosTotales: ingresosTotales,
      });

      setError('');
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar estadísticas: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calcularPorcentaje = (valor, total) => {
    if (total === 0) return 0;
    return ((valor / total) * 100).toFixed(1);
  };

  if (loading) {
    return <div className="loading">Cargando reportes...</div>;
  }

  return (
    <div className="reportes">
      <div className="header">
        <h2>Reportes y Estadísticas</h2>
        <button className="btn-refresh" onClick={cargarEstadisticas}>
          🔄 Actualizar
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Resumen General */}
      <div className="seccion">
        <h3>📊 Resumen General</h3>
        <div className="cards-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-label">Total Servicios</div>
              <div className="stat-value">{estadisticas.totalServicios}</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-label">Total Clientes</div>
              <div className="stat-value">{estadisticas.totalClientes}</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">🚚</div>
            <div className="stat-content">
              <div className="stat-label">Vehículos</div>
              <div className="stat-value">
                {estadisticas.vehiculosDisponibles}/{estadisticas.totalVehiculos}
              </div>
              <div className="stat-sublabel">Disponibles</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-label">Ingresos Totales</div>
              <div className="stat-value-money">{formatCurrency(estadisticas.ingresosTotales)}</div>
              <div className="stat-sublabel">{estadisticas.totalPagos} pagos registrados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de Servicios */}
      <div className="seccion">
        <h3>📈 Estado de Servicios</h3>
        <div className="cards-grid-estados">
          <div className="estado-card pendiente">
            <div className="estado-header">
              <span className="estado-icon">⏳</span>
              <span className="estado-nombre">Pendientes</span>
            </div>
            <div className="estado-valor">{estadisticas.serviciosPendientes}</div>
            <div className="estado-porcentaje">
              {calcularPorcentaje(estadisticas.serviciosPendientes, estadisticas.totalServicios)}%
            </div>
            <div className="estado-barra">
              <div 
                className="estado-barra-fill pendiente-fill"
                style={{ width: `${calcularPorcentaje(estadisticas.serviciosPendientes, estadisticas.totalServicios)}%` }}
              ></div>
            </div>
          </div>

          <div className="estado-card proceso">
            <div className="estado-header">
              <span className="estado-icon">🔄</span>
              <span className="estado-nombre">En Proceso</span>
            </div>
            <div className="estado-valor">{estadisticas.serviciosEnProceso}</div>
            <div className="estado-porcentaje">
              {calcularPorcentaje(estadisticas.serviciosEnProceso, estadisticas.totalServicios)}%
            </div>
            <div className="estado-barra">
              <div 
                className="estado-barra-fill proceso-fill"
                style={{ width: `${calcularPorcentaje(estadisticas.serviciosEnProceso, estadisticas.totalServicios)}%` }}
              ></div>
            </div>
          </div>

          <div className="estado-card completado">
            <div className="estado-header">
              <span className="estado-icon">✅</span>
              <span className="estado-nombre">Completados</span>
            </div>
            <div className="estado-valor">{estadisticas.serviciosCompletados}</div>
            <div className="estado-porcentaje">
              {calcularPorcentaje(estadisticas.serviciosCompletados, estadisticas.totalServicios)}%
            </div>
            <div className="estado-barra">
              <div 
                className="estado-barra-fill completado-fill"
                style={{ width: `${calcularPorcentaje(estadisticas.serviciosCompletados, estadisticas.totalServicios)}%` }}
              ></div>
            </div>
          </div>

          <div className="estado-card cancelado">
            <div className="estado-header">
              <span className="estado-icon">❌</span>
              <span className="estado-nombre">Cancelados</span>
            </div>
            <div className="estado-valor">{estadisticas.serviciosCancelados}</div>
            <div className="estado-porcentaje">
              {calcularPorcentaje(estadisticas.serviciosCancelados, estadisticas.totalServicios)}%
            </div>
            <div className="estado-barra">
              <div 
                className="estado-barra-fill cancelado-fill"
                style={{ width: `${calcularPorcentaje(estadisticas.serviciosCancelados, estadisticas.totalServicios)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores Clave */}
      <div className="seccion">
        <h3>🎯 Indicadores Clave</h3>
        <div className="indicadores-grid">
          <div className="indicador-card">
            <div className="indicador-label">Tasa de Completados</div>
            <div className="indicador-valor">
              {calcularPorcentaje(estadisticas.serviciosCompletados, estadisticas.totalServicios)}%
            </div>
            <div className="indicador-descripcion">
              {estadisticas.serviciosCompletados} de {estadisticas.totalServicios} servicios
            </div>
          </div>

          <div className="indicador-card">
            <div className="indicador-label">Ingreso Promedio por Pago</div>
            <div className="indicador-valor-money">
              {formatCurrency(estadisticas.totalPagos > 0 ? estadisticas.ingresosTotales / estadisticas.totalPagos : 0)}
            </div>
            <div className="indicador-descripcion">
              Basado en {estadisticas.totalPagos} pagos
            </div>
          </div>

          <div className="indicador-card">
            <div className="indicador-label">Disponibilidad de Flota</div>
            <div className="indicador-valor">
              {calcularPorcentaje(estadisticas.vehiculosDisponibles, estadisticas.totalVehiculos)}%
            </div>
            <div className="indicador-descripcion">
              {estadisticas.vehiculosDisponibles} vehículos disponibles
            </div>
          </div>

          <div className="indicador-card">
            <div className="indicador-label">Servicios por Cliente</div>
            <div className="indicador-valor">
              {estadisticas.totalClientes > 0 ? (estadisticas.totalServicios / estadisticas.totalClientes).toFixed(1) : 0}
            </div>
            <div className="indicador-descripcion">
              Promedio de servicios
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
