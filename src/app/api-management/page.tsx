import React from 'react';
import ApiManagementInteractive from './components/ApiManagementInteractive';

export const metadata = {
  title: 'API Management - Sayada VidGen',
  description: 'Manage API keys and webhook configurations for external integrations'
};

export default function ApiManagementPage() {
  return <ApiManagementInteractive />;
}