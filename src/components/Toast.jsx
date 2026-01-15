import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const Toast = ({ message, onClose }) => {
     useEffect(() => {
          const timer = setTimeout(() => {
               onClose();
          }, 3000);
          return () => clearTimeout(timer);
     }, [onClose]);

     return (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
               <div className="bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-bold text-sm">{message}</span>
               </div>
          </div>
     );
};

export default Toast;
