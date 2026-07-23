export const resources = {
  accounts: {
    label: 'Accounts', singular: 'account', endpoint: '/admin/v1/accounts', icon: 'Users',
    description: 'Manage gateway customer accounts and their availability.',
    columns: [['ID', 'ID'], ['Email', 'Email'], ['Enabled', 'Enabled'], ['Created at', 'CreatedAt']],
    fields: [{ name: 'email', label: 'Email address', type: 'email', required: true }, { name: 'enabled', label: 'Enabled', type: 'checkbox', initial: true }],
  },
  providers: {
    label: 'Providers', singular: 'provider', endpoint: '/admin/v1/providers', icon: 'Cloud',
    description: 'Configure compatible upstream providers for an account.',
    columns: [['ID', 'ID'], ['Name', 'Name'], ['Account', 'AccountID'], ['Adapter', 'AdapterType'], ['Enabled', 'Enabled']],
    fields: [
      { name: 'account_id', label: 'Account', required: true, relation: 'accounts' },
      { name: 'name', label: 'Provider name', required: true, placeholder: 'openai-compatible' },
      { name: 'base_url', label: 'Base URL', type: 'url', required: true, placeholder: 'https://api.example.com/v1' },
      { name: 'adapter_type', label: 'Adapter type', required: true, initial: 'openai_compatible' },
    ],
  },
  keys: {
    label: 'API keys', singular: 'API key', endpoint: '/admin/v1/keys', icon: 'KeyRound',
    description: 'Store provider credentials. Values are only accepted at creation and remain masked thereafter.',
    columns: [['ID', 'ID'], ['Label', 'Label'], ['Provider', 'ProviderID'], ['Secret', 'MaskedSecret'], ['Enabled', 'Enabled']],
    fields: [
      { name: 'provider_id', label: 'Provider', required: true, relation: 'providers' },
      { name: 'label', label: 'Key label', required: true, placeholder: 'primary' },
      { name: 'secret', label: 'Secret', type: 'password', required: true, placeholder: 'Paste the provider key' },
    ],
  },
  models: {
    label: 'Models', singular: 'model', endpoint: '/admin/v1/models', icon: 'Box',
    description: 'Map logical model names to upstream model identifiers.',
    columns: [['ID', 'ID'], ['Logical name', 'LogicalName'], ['Upstream model', 'UpstreamModel'], ['API key', 'APIKeyID'], ['Enabled', 'Enabled']],
    fields: [
      { name: 'api_key_id', label: 'API key', required: true, relation: 'keys' },
      { name: 'logical_name', label: 'Logical model name', required: true, placeholder: 'gpt-4o-mini' },
      { name: 'upstream_model', label: 'Upstream model', required: true, placeholder: 'gpt-4o-mini' },
    ],
  },
}

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'accounts', label: 'Accounts', icon: 'Users' },
  { id: 'providers', label: 'Providers', icon: 'Cloud' },
  { id: 'keys', label: 'API keys', icon: 'KeyRound' },
  { id: 'models', label: 'Models', icon: 'Box' },
  { id: 'routes', label: 'Routes', icon: 'GitFork' },
  { id: 'health', label: 'System health', icon: 'HeartPulse' },
  { id: 'playground', label: 'Test API', icon: 'MessageSquare' },
]
