import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  useEffect(() => {
    if (!usuario) {
      navigate("/login");
      return;
    }


    // Redirigir según el rol
    switch (usuario.rol) {
      case 'SUPERADMIN':
        navigate("/superadmin", { replace: true });
        break;
      case 'ADMINISTRADOR':
        navigate("/admin", { replace: true });
        break;
      case 'SUPERVISOR':
        navigate("/supervisor", { replace: true });
        break;
      case 'OPERATIVO':
        navigate("/nombre-ingreso", { replace: true });
        break;
      default:
        navigate("/login", { replace: true });
        break;
    }
  }, [usuario, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  );
};

export default Dashboard;