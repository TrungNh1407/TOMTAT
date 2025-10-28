import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './AuthContext';
import { isAiStudio } from './isAiStudio';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const AppWrapper: React.FC = () => {
  if (isAiStudio()) {
    return <App />;
  }

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
