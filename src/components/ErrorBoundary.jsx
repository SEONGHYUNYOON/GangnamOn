import React from 'react';

class ErrorBoundary extends React.Component {
     constructor(props) {
          super(props);
          this.state = { hasError: false, error: null, errorInfo: null };
     }

     static getDerivedStateFromError(error) {
          return { hasError: true };
     }

     componentDidCatch(error, errorInfo) {
          this.setState({
               error: error,
               errorInfo: errorInfo
          });
          console.error("Uncaught error:", error, errorInfo);
     }

     render() {
          if (this.state.hasError) {
               return (
                    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
                         <h1>Something went wrong.</h1>
                         <details style={{ whiteSpace: 'pre-wrap' }}>
                              {this.state.error && this.state.error.toString()}
                              <br />
                              {this.state.errorInfo && this.state.errorInfo.componentStack}
                         </details>
                         <button
                              onClick={() => window.location.reload()}
                              style={{ marginTop: '20px', padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                         >
                              Reload Page
                         </button>
                    </div>
               );
          }

          return this.props.children;
     }
}

export default ErrorBoundary;
