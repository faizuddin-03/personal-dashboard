import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Contacts from './pages/Contacts';
import Dealers from './pages/Dealers';
import ContactForm from './pages/ContactForm';
import ContactsImport from './pages/ContactsImport';
import Segments from './pages/Segments';
import Templates from './pages/Templates';
import TemplateForm from './pages/TemplateForm';
import Blasts from './pages/Blasts';
import BlastWizard from './pages/BlastWizard';
import CampaignWizard from './pages/CampaignWizard';
import BlastDetail from './pages/BlastDetail';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Inbox from './pages/Inbox';
import Knowledge from './pages/Knowledge';
import Performance from './pages/Performance';
import Simulator from './pages/Simulator';
import Layout from './components/Layout';
import { ProtectedRoute } from './auth/ProtectedRoute';
import StyledPlaceholder from './components/StyledPlaceholder';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <Layout><Dealers /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts/new"
        element={
          <ProtectedRoute>
            <Layout><ContactForm /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts/import"
        element={
          <ProtectedRoute>
            <Layout><ContactsImport /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts/:id"
        element={
          <ProtectedRoute>
            <Layout><ContactForm /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/segments"
        element={
          <ProtectedRoute>
            <Layout><Segments /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <Layout><Templates /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates/new"
        element={
          <ProtectedRoute>
            <Layout><TemplateForm /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates/:name"
        element={
          <ProtectedRoute>
            <Layout><TemplateForm /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/blasts"
        element={
          <ProtectedRoute>
            <Layout><Campaigns /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/blasts/new"
        element={
          <ProtectedRoute>
            <Layout><CampaignWizard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/blasts/:id"
        element={
          <ProtectedRoute>
            <Layout><CampaignDetail /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requireRole="ADMIN">
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/inbox" element={<ProtectedRoute><Layout><Inbox /></Layout></ProtectedRoute>} />
      <Route path="/inbox/:contactId" element={<ProtectedRoute><Layout><Inbox /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Layout><Performance /></Layout></ProtectedRoute>} />
      <Route path="/workflows" element={<ProtectedRoute><Layout><StyledPlaceholder title="Daily playbook" /></Layout></ProtectedRoute>} />
      <Route path="/helpline" element={<ProtectedRoute><Layout><StyledPlaceholder title="Helpline" /></Layout></ProtectedRoute>} />
      <Route path="/status" element={<ProtectedRoute><Layout><StyledPlaceholder title="System status" /></Layout></ProtectedRoute>} />
      <Route path="/knowledge" element={<ProtectedRoute requireRole="ADMIN"><Layout><Knowledge /></Layout></ProtectedRoute>} />
      <Route path="/simulator" element={<ProtectedRoute requireRole="ADMIN"><Layout><Simulator /></Layout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute requireRole="ADMIN"><Layout><StyledPlaceholder title="Users & roles" /></Layout></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute requireRole="ADMIN"><Layout><StyledPlaceholder title="Audit log" /></Layout></ProtectedRoute>} />
    </Routes>
  );
}
