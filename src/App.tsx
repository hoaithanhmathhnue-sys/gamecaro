import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ApiKeyModal from './components/ApiKeyModal';
import Dashboard from './pages/Dashboard';
import Game from './pages/Game';
import Admin from './pages/Admin';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <ApiKeyModal />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="game/:subjectId" element={<Game />} />
          <Route path="admin" element={<Admin />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

