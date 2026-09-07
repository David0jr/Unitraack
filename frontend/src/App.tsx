import { BrowserRouter as Router} from 'react-router-dom';
import MainRoutes from './routes/MainRoutes';

import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';

function App() {
  return (
    <Router>
      <TenantProvider>
        <AuthProvider>
          <MainRoutes />
        </AuthProvider>
      </TenantProvider>
    </Router>
  );
}

export default App;
