import { BrowserRouter as Router} from 'react-router-dom';
import MainRoutes from './routes/MainRoutes';

import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SessionTimeoutHandler } from './components/SessionTimeoutHandler';

function App() {
  return (
    <Router>
      <TenantProvider>
        <AuthProvider>
          <NotificationProvider>
            <SessionTimeoutHandler />
            <MainRoutes />
          </NotificationProvider>
        </AuthProvider>
      </TenantProvider>
    </Router>
  );
}

export default App;
