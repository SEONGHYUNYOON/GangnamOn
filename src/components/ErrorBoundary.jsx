import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
     constructor(props) {
          super(props);
          this.state = { hasError: false, error: null, errorInfo: null };
     }

     static getDerivedStateFromError(error) {
          // Update state so the next render will show the fallback UI.
          return { hasError: true, error };
     }

     componentDidCatch(error, errorInfo) {
          // You can also log the error to an error reporting service
          console.error("Uncaught error:", error, errorInfo);
          this.setState({ errorInfo });
     }

     handleReload = () => {
          window.location.reload();
     };

     render() {
          if (this.state.hasError) {
               // You can render any custom fallback UI
               return (
                    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-gray-100 shadow-xl text-center">
                         <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                              <AlertTriangle className="w-8 h-8 text-red-500" />
                         </div>
                         <h2 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
                         <p className="text-gray-500 mb-8 max-w-md">
                              죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주시거나 페이지를 새로고침 해주세요.
                         </p>

                         {/* Developer Details (Optional: Can hide in production) */}
                         {process.env.NODE_ENV === 'development' && this.state.error && (
                              <div className="w-full max-w-lg bg-gray-100 p-4 rounded-lg text-left mb-6 overflow-auto max-h-40 text-xs font-mono text-red-600">
                                   {this.state.error.toString()}
                              </div>
                         )}

                         <button
                              onClick={this.handleReload}
                              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                         >
                              <RefreshCw className="w-4 h-4" />
                              페이지 새로고침
                         </button>
                    </div>
               );
          }

          return this.props.children;
     }
}

export default ErrorBoundary;
