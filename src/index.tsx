import ReactDOM from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';

import 'nprogress/nprogress.css';
import App from 'src/App';
import { SidebarProvider } from 'src/contexts/SidebarContext';
import { AuthProvider } from 'src/contexts/AuthContext';
import * as serviceWorker from 'src/serviceWorker';

import { ChatProvider } from 'src/contexts/ChatContext';

ReactDOM.render(
  <HelmetProvider>
    <AuthProvider>
      <ChatProvider>
        <SidebarProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SidebarProvider>
      </ChatProvider>
    </AuthProvider>
  </HelmetProvider>,
  document.getElementById('root')
);

serviceWorker.unregister();
