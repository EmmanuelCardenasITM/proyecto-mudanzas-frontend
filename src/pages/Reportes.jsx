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

  const [finanzas, setFinanzas] = useState({
    totalCobrado: 0,
    valorServiciosPagados: 0,
    gananciaNeta: 0,
    totalSobrante: 0,
    saldoPendiente: 0,
    valorTotalServicios: 0,
    margenGanancia: 0,
    serviciosPagadosCompletos: 0,
    serviciosConSobrante: 0,
    serviciosConDeuda: 0,
    detalleServicios: [],
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const obtenerCostoServicio = (servicio) =>
    parseFloat(servicio?.costo_total ?? servicio?.costo_base ?? 0) || 0;

  const esServicioCancelado = (servicio) =>
    (servicio?.estado || '').toLowerCase() === 'cancelado';

  const calcularFinanzas = (servicios, pagos) => {
    const serviciosMap = Object.fromEntries(servicios.map((s) => [String(s.id), s]));

    const pagosPorServicio = pagos.reduce((acc, pago) => {
      const servicioId = String(pago.servicio_id);
      const servicio = serviciosMap[servicioId];
      const costo =
        parseFloat(pago.costo_total) ||
        obtenerCostoServicio(servicio);

      if (!acc[servicioId]) {
        acc[servicioId] = {
          servicioId,
          etiqueta: servicio
            ? `${servicio.ciudad_origen || '?'} → ${servicio.ciudad_destino || '?'}`
            : `Servicio #${servicioId}`,
          costo,
          totalPagado: 0,
        };
      }

      acc[servicioId].totalPagado += parseFloat(pago.monto) || 0;
      return acc;
    }, {});

    const totalCobrado = pagos.reduce(
      (sum, pago) => sum + (parseFloat(pago.monto) || 0),
      0
    );

    const detalleServicios = Object.values(pagosPorServicio).map((item) => {
      const ganancia = Math.min(item.totalPagado, item.costo);
      const sobrante = Math.max(0, item.totalPagado - item.costo);
      const faltaPorCobrar = Math.max(0, item.costo - item.totalPagado);

      return {
        ...item,
        ganancia,
        sobrante,
        faltaPorCobrar,
      };
    });

    const valorServiciosPagados = detalleServicios.reduce(
      (sum, item) => sum + item.costo,
      0
    );

    const gananciaNeta = detalleServicios.reduce(
      (sum, item) => sum + item.ganancia,
      0
    );

    const totalSobrante = detalleServicios.reduce(
      (sum, item) => sum + item.sobrante,
      0
    );

    let saldoPendiente = 0;
    let serviciosPagadosCompletos = 0;
    let serviciosConSobrante = 0;
    let serviciosConDeuda = 0;

    detalleServicios.forEach((item) => {
      if (item.totalPagado >= item.costo) serviciosPagadosCompletos += 1;
      if (item.sobrante > 0) serviciosConSobrante += 1;
    });

    servicios.forEach((servicio) => {
      if (esServicioCancelado(servicio)) return;

      const costo = obtenerCostoServicio(servicio);
      const pagado = pagosPorServicio[String(servicio.id)]?.totalPagado || 0;

      if (pagado < costo) {
        serviciosConDeuda += 1;
        saldoPendiente += costo - pagado;
      }
    });

    const valorTotalServicios = servicios.reduce(
      (sum, servicio) => sum + obtenerCostoServicio(servicio),
      0
    );

    const margenGanancia =
      valorServiciosPagados > 0
        ? (gananciaNeta / valorServiciosPagados) * 100
        : 0;

    return {
      totalCobrado,
      valorServiciosPagados,
      gananciaNeta,
      totalSobrante,
      saldoPendiente,
      valorTotalServicios,
      margenGanancia,
      serviciosPagadosCompletos,
      serviciosConSobrante,
      serviciosConDeuda,
      detalleServicios,
    };
  };

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
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {});

      const ingresosTotales = pagos.reduce((total, pago) => {
        return total + (parseFloat(pago.monto) || 0);
      }, 0);

      setFinanzas(calcularFinanzas(servicios, pagos));

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
              <div className="stat-label">Total Cobrado</div>
              <div className="stat-value-money">{formatCurrency(estadisticas.ingresosTotales)}</div>
              <div className="stat-sublabel">{estadisticas.totalPagos} pagos registrados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Finanzas */}
      <div className="seccion">
        <h3>💵 Finanzas del Sistema</h3>
        <p className="finanzas-descripcion">
          La ganancia de cada servicio es como máximo su costo. Si el cliente paga de más,
          el excedente no cuenta como ganancia (es cambio a devolver).
        </p>
        <div className="cards-grid finanzas-grid">
          <div className="stat-card finanza-cobrado">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <div className="stat-label">Total Cobrado</div>
              <div className="stat-value-money">{formatCurrency(finanzas.totalCobrado)}</div>
              <div className="stat-sublabel">Suma de todos los pagos</div>
            </div>
          </div>

          <div className="stat-card finanza-costo">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-label">Costo de Servicios Pagados</div>
              <div className="stat-value-money neutral">
                {formatCurrency(finanzas.valorServiciosPagados)}
              </div>
              <div className="stat-sublabel">Valor según tarifas del sistema</div>
            </div>
          </div>

          <div className={`stat-card ${finanzas.gananciaNeta >= 0 ? 'finanza-ganancia' : 'finanza-perdida'}`}>
            <div className="stat-icon">{finanzas.gananciaNeta >= 0 ? '📈' : '📉'}</div>
            <div className="stat-content">
              <div className="stat-label">Ganancia Neta</div>
              <div className={`stat-value-money ${finanzas.gananciaNeta >= 0 ? 'positivo' : 'negativo'}`}>
                {formatCurrency(finanzas.gananciaNeta)}
              </div>
              <div className="stat-sublabel">
                Ingreso real reconocido (máx. el costo de cada servicio)
              </div>
            </div>
          </div>

          <div className="stat-card finanza-pendiente">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-label">Por Cobrar</div>
              <div className="stat-value-money negativo">
                {formatCurrency(finanzas.saldoPendiente)}
              </div>
              <div className="stat-sublabel">
                {finanzas.serviciosConDeuda} servicio(s) con pago incompleto
              </div>
            </div>
          </div>
        </div>

        <div className="finanzas-resumen">
          <div className="finanza-resumen-item">
            <span>Valor total de todos los servicios</span>
            <strong>{formatCurrency(finanzas.valorTotalServicios)}</strong>
          </div>
          <div className="finanza-resumen-item">
            <span>Margen sobre servicios pagados</span>
            <strong className={finanzas.margenGanancia >= 0 ? 'positivo' : 'negativo'}>
              {finanzas.margenGanancia.toFixed(1)}%
            </strong>
          </div>
          <div className="finanza-resumen-item">
            <span>Sobrante en pagos (cambio a devolver)</span>
            <strong className="neutral">{formatCurrency(finanzas.totalSobrante)}</strong>
          </div>
          <div className="finanza-resumen-item">
            <span>Servicios con pago en exceso</span>
            <strong>{finanzas.serviciosConSobrante}</strong>
          </div>
        </div>

        {finanzas.detalleServicios.length > 0 && (
          <div className="finanzas-tabla-container">
            <h4>Detalle por servicio con pagos</h4>
            <table className="finanzas-tabla">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Costo</th>
                  <th>Cobrado</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {finanzas.detalleServicios.map((item) => (
                  <tr key={item.servicioId}>
                    <td>{item.etiqueta}</td>
                    <td>{formatCurrency(item.costo)}</td>
                    <td>{formatCurrency(item.totalPagado)}</td>
                    <td>
                      <div className={item.ganancia > 0 ? 'resultado-ganancia' : ''}>
                        {formatCurrency(item.ganancia)}
                        <span className="resultado-etiqueta"> ganancia</span>
                      </div>
                      {item.sobrante > 0 && (
                        <div className="resultado-sobrante">
                          {formatCurrency(item.sobrante)}
                          <span className="resultado-etiqueta"> cambio a devolver</span>
                        </div>
                      )}
                      {item.faltaPorCobrar > 0 && (
                        <div className="resultado-perdida">
                          −{formatCurrency(item.faltaPorCobrar)}
                          <span className="resultado-etiqueta"> falta por cobrar</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
            <div className="indicador-label">Ganancia Promedio por Servicio</div>
            <div className={`indicador-valor-money ${finanzas.gananciaNeta >= 0 ? '' : 'negativo'}`}>
              {formatCurrency(
                finanzas.detalleServicios.length > 0
                  ? finanzas.gananciaNeta / finanzas.detalleServicios.length
                  : 0
              )}
            </div>
            <div className="indicador-descripcion">
              {finanzas.detalleServicios.length} servicio(s) con pagos
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
