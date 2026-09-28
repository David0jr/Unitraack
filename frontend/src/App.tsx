import { BrowserRouter as Router} from 'react-router-dom';
import MainRoutes from './routes/MainRoutes';

import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <Router>
      <TenantProvider>
        <AuthProvider>
          <NotificationProvider>
            <MainRoutes />
          </NotificationProvider>
        </AuthProvider>
      </TenantProvider>
    </Router>
  );
}

export default App;
