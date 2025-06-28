import { useEffect, useState } from 'react';
import { useAppSelector } from '@/hooks/useStore';
import { X } from 'lucide-react';

interface MaintenanceModeBannerProps {
  isAdmin?: boolean;
}

const MaintenanceModeBanner = ({ isAdmin = false }: MaintenanceModeBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useAppSelector((state) => state.auth);
  
  // Hide banner if dismissed
  useEffect(() => {
    const bannerDismissed = localStorage.getItem('maintenanceBannerDismissed');
    if (bannerDismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('maintenanceBannerDismissed', 'true');
  };

  // Don't show anything if banner is dismissed or user is not admin
  if (!isVisible || (isAdmin && user?.role !== 'admin')) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-black p-2 flex items-center justify-between">
      <div className="flex-1 text-center">
        {isAdmin ? (
          <p className="font-medium">
            <span className="font-bold">⚠️ Maintenance Mode Active:</span> Only administrators can access the system.
          </p>
        ) : (
          <p className="font-medium">
            <span className="font-bold">⚠️ Notice:</span> System is in maintenance mode. Some features may be unavailable.
          </p>
        )}
      </div>
      <button 
        onClick={handleDismiss} 
        className="p-1 hover:bg-yellow-600 rounded-full"
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default MaintenanceModeBanner; 