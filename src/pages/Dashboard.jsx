import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import GestionUsuarios from './GestionUsuarios';
import GestionServicios from './GestionServicios';
import GestionClientes from './GestionClientes';
import GestionVehiculos from './GestionVehiculos';
import GestionTarifas from './GestionTarifas';
import GestionPagos from './GestionPagos';
import Reportes from './Reportes';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'usuarios':
        return <GestionUsuarios />;
      case 'servicios':
        return <GestionServicios />;
      case 'clientes':
        return <GestionClientes />;
      case 'vehiculos':
        return <GestionVehiculos />;
      case 'tarifas':
        return <GestionTarifas />;
      case 'pagos':
        return <GestionPagos />;
      case 'reportes':
        return <Reportes />;
      default:
        return (
          <div className="dashboard-home">
            <h2>Dashboard</h2>
            <p>¡Bienvenido al sistema de gestión de mudanzas!</p>
            
            <div className="dashboard-cards">
              <div className="card" onClick={() => setActiveSection('servicios')}>
                <h3>Servicios de Mudanza</h3>
                <p>Gestiona todos los servicios</p>
              </div>

              <div className="card" onClick={() => setActiveSection('clientes')}>
                <h3>Clientes</h3>
                <p>Administra la base de clientes</p>
              </div>
              
              <div className="card" onClick={() => setActiveSection('usuarios')}>
                <h3>Usuarios</h3>
                <p>Administra usuarios del sistema</p>
              </div>
              
              <div className="card" onClick={() => setActiveSection('vehiculos')}>
                <h3>Vehículos</h3>
                <p>Gestiona la flota de vehículos</p>
              </div>

              <div className="card" onClick={() => setActiveSection('tarifas')}>
                <h3>Tarifas</h3>
                <p>Configura tarifas del servicio</p>
              </div>

              <div className="card" onClick={() => setActiveSection('pagos')}>
                <h3>Pagos</h3>
                <p>Gestiona pagos y facturación</p>
              </div>

              <div className="card" onClick={() => setActiveSection('reportes')}>
                <h3>Reportes</h3>
                <p>Estadísticas y reportes</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h1>Sistema de Mudanzas</h1>
        <div className="nav-user">
          <span>Bienvenido, {user?.nombre || user?.email}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <ul className="menu">
            <li 
              className={activeSection === 'home' ? 'active' : ''} 
              onClick={() => setActiveSection('home')}
            >
              <span>🏠</span> Inicio
            </li>
            <li 
              className={activeSection === 'servicios' ? 'active' : ''} 
              onClick={() => setActiveSection('servicios')}
            >
              <span>📦</span> Servicios
            </li>
            <li 
              className={activeSection === 'clientes' ? 'active' : ''} 
              onClick={() => setActiveSection('clientes')}
            >
              <span>👥</span> Clientes
            </li>
            <li 
              className={activeSection === 'usuarios' ? 'active' : ''} 
              onClick={() => setActiveSection('usuarios')}
            >
              <span>👤</span> Usuarios
            </li>
            <li 
              className={activeSection === 'vehiculos' ? 'active' : ''} 
              onClick={() => setActiveSection('vehiculos')}
            >
              <span>🚚</span> Vehículos
            </li>
            <li 
              className={activeSection === 'tarifas' ? 'active' : ''} 
              onClick={() => setActiveSection('tarifas')}
            >
              <span>💵</span> Tarifas
            </li>
            <li 
              className={activeSection === 'pagos' ? 'active' : ''} 
              onClick={() => setActiveSection('pagos')}
            >
              <span>💳</span> Pagos
            </li>
            <li 
              className={activeSection === 'reportes' ? 'active' : ''} 
              onClick={() => setActiveSection('reportes')}
            >
              <span>📊</span> Reportes
            </li>
          </ul>
        </aside>

        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
