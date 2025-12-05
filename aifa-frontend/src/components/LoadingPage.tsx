import { Loader2 } from "lucide-react";
import React from "react";

const LoadingPage: React.FC = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-gray-600 font-medium">Cargando...</p>
      </div>
    </div>
  );
};

export default LoadingPage;
