import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard';
// Accesos
import AccesoList from './pages/Accesos/AccesoList';
import AccesoCreate from './pages/Accesos/AccesoCreate';
import AccesoView from './pages/Accesos/AccesoView';
import AccesoEdit from './pages/Accesos/AccesoEdit';
// Turnos
import TurnoList from './pages/Turnos/TurnoList';
import TurnoCreate from './pages/Turnos/TurnoCreate';
import TurnoAsignar from './pages/Turnos/TurnoAsignar';
import TurnoView from './pages/Turnos/TurnoView';
// Reportes
import ReporteGlobal from './pages/Reportes/ReporteGlobal';
import ReportePersonas from './pages/Reportes/ReportePersonas';
// Identificaciones
import IdentificacionesList from './pages/Identificaciones/IdentificacionesList';
import IdentificacionesRetenidas from './pages/Identificaciones/IdentificacionesRetenidas';
//Usuarios
import UsuarioList from './pages/Usuarios/UsuarioList';
import UsuarioCreate from './pages/Usuarios/UsuarioCreate';
import UsuarioEdit from './pages/Usuarios/UsuarioEdit';
//Dashboard
import SuperadminDashboard from './pages/Dashboard/SuperadminDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import SupervisorDashboard from './pages/Dashboard/SupervisorDashboard';
import OperativoDashboard from './pages/Dashboard/OperativoDashboard';
//Auditoria
import LogsSistema from './pages/Auditoria/LogsSistema';
import LogsFiltro from './pages/Auditoria/LogsFiltro';
import AuditoriaView from './pages/Auditoria/AuditoriaView';
//Base-datos
import ExportarDB from './pages/base-datos/ExportarDB';
import ImportarDB from './pages/base-datos/ImportarDB';
//Perfiles
import Profile from './pages/Profile/Profile';
import EditProfile from './pages/Profile/EditProfile';
//Filtros
import FiltroCreate from './pages/Filtros/FiltroCreate';
import FiltroEdit from './pages/Filtros/FiltroEdit';
import FiltroList from './pages/Filtros/FiltroList';

import LoadingPage from './components/LoadingPage';
import ReporteFiltros from './pages/Reportes/ReporteFiltros';
import AccesoEspecial from './pages/Accesos/AccesoEspecial';
import TIASCreate from './pages/Tias/TIASCreate';
import TIASList from './pages/Tias/TIASList';
import TIASCreateRango from './pages/Tias/TIASCreateRango';
import TIASEdit from './pages/Tias/TIASEdit';
import NombreIngreso from './pages/Login/NombreIngreso';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingPage />;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Ruta de login para usuarios ya autenticados */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route path="/nombre-ingreso" element={
        <ProtectedRoute>
          <NombreIngreso />
        </ProtectedRoute>
      } />

      {/* Dashboard principal */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/superadmin" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN']}>
          <SuperadminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/supervisor" element={
        <ProtectedRoute requiredRoles={['SUPERVISOR']}>
          <SupervisorDashboard />
        </ProtectedRoute>
      } />

      <Route path="/operativo" element={
        <ProtectedRoute requiredRoles={['OPERATIVO']}>
          <OperativoDashboard />
        </ProtectedRoute>
      } />

      <Route path="/perfil" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/perfil/update" element={
        <ProtectedRoute>
          <EditProfile />
        </ProtectedRoute>
      } />

      {/* MÓDULO DE ACCESOS */}
      <Route path="/accesos" element={
        <ProtectedRoute>
          <AccesoList />
        </ProtectedRoute>
      } />
      <Route path="/accesos/crear" element={
        <ProtectedRoute requiredRoles={['OPERATIVO']}>
          <AccesoCreate />
        </ProtectedRoute>
      } />
      <Route path="/accesospecial/crear" element={
        <ProtectedRoute requiredRoles={['OPERATIVO']}>
          <AccesoEspecial />
        </ProtectedRoute>
      } />
      <Route path="/accesos/ver/:id" element={
        <ProtectedRoute>
          <AccesoView />
        </ProtectedRoute>
      } />
      <Route path="/accesos/editar/:id" element={
        <ProtectedRoute requiredRoles={['OPERATIVO']}>
          <AccesoEdit />
        </ProtectedRoute>
      } />

      {/* MÓDULO DE TURNOS */}
      <Route path="/turnos" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <TurnoList />
        </ProtectedRoute>
      } />
      <Route path="/turnos/crear" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <TurnoCreate />
        </ProtectedRoute>
      } />
      <Route path="/turnos/:id/asignar" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <TurnoAsignar />
        </ProtectedRoute>
      } />
      <Route path="/turnos/ver/:id" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <TurnoView />
        </ProtectedRoute>
      } />

      {/* MÓDULO DE REPORTES */}
      <Route path="/reportes" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMINISTRADOR']}>
          <ReporteGlobal />
        </ProtectedRoute>
      } />
      <Route path="/reportes/filtros" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']}>
          <ReporteFiltros />
        </ProtectedRoute>
      } />
      <Route path="/reportes/personas" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']}>
          <ReportePersonas />
        </ProtectedRoute>
      } />

      {/* MÓDULO DE IDENTIFICACIONES */}
      <Route path="/identificaciones" element={
        <ProtectedRoute>
          <IdentificacionesList />
        </ProtectedRoute>
      } />
      <Route path="/identificaciones/retenidas" element={
        <ProtectedRoute>
          <IdentificacionesRetenidas />
        </ProtectedRoute>
      } />

      <Route path="/logs/sistema" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMINISTRADOR']}>
          <LogsSistema />
        </ProtectedRoute>
      } />
      <Route path="/filtro" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN', 'SUPERVISOR']}>
          <LogsFiltro />
        </ProtectedRoute>
      } />
      <Route path="/detalle/:id" element={
        <ProtectedRoute>
          <AuditoriaView />
        </ProtectedRoute>
      } />

      {/* MÓDULO DE FILTROS */}
      <Route path="/filtros/crear" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <FiltroCreate />
        </ProtectedRoute>
      } />
      <Route path="/filtros/editar/:id" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <FiltroEdit />
        </ProtectedRoute>
      } />
      <Route path="/filtros" element={
        <ProtectedRoute>
          <FiltroList />
        </ProtectedRoute>
      } />

      {/* MÓDULO DE TIAS */}
      <Route path="/tias/crear" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <TIASCreate />
        </ProtectedRoute>
      } />
      <Route path="/tias/crear-rango" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <TIASCreateRango />
        </ProtectedRoute>
      } />
      <Route path="/tias/editar/:id" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <TIASEdit />
        </ProtectedRoute>
      } />
      <Route path="/tias" element={
        <ProtectedRoute>
          <TIASList />
        </ProtectedRoute>
      } />

      {/* MÓDULO DE USUARIOS */}
      <Route path="/usuarios" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMINISTRADOR']}>
          <UsuarioList />
        </ProtectedRoute>
      } />
      <Route path="/usuarios/crear" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMINISTRADOR']}>
          <UsuarioCreate />
        </ProtectedRoute>
      } />
      <Route path="/usuarios/editar/:id" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMINISTRADOR']}>
          <UsuarioEdit />
        </ProtectedRoute>
      } />

      <Route path="/exportar" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMINISTRADOR', 'OPERATIVO']}>
          <ExportarDB />
        </ProtectedRoute>
      } />
      <Route path="/importar" element={
        <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMINISTRADOR']}>
          <ImportarDB />
        </ProtectedRoute>
      } />

      {/* Rutas por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default AppRoutes;