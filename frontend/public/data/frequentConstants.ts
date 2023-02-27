interface Mapping {
  [key: string]: string;
}

const integrationSlugNameMapping: Mapping = {
  'azure-key-vault': 'Azure Key Vault',
  'aws-parameter-store': 'AWS Parameter Store',
  'aws-secret-manager': 'AWS Secret Manager',
  'heroku': 'Heroku',
  'vercel': 'Vercel',
  'netlify': 'Netlify',
  'github': 'GitHub',
  'render': 'Render',
  'flyio': 'Fly.io',
  "circleci": 'CircleCI'
}

const envMapping: Mapping = {
  Development: "dev",
  Staging: "staging",
  Production: "prod",
  Testing: "test",
};

const reverseEnvMapping: Mapping = {
  dev: "Development",
  staging: "Staging",
  prod: "Production",
  test: "Testing",
};

const contextNetlifyMapping: Mapping = {
  "dev": "Local development",
  "branch-deploy": "Branch deploys",
  "deploy-preview": "Deploy Previews",
  "production": "Production"
}

const reverseContextNetlifyMapping: Mapping = {
  "Local development": "dev",
  "Branch deploys": "branch-deploy",
  "Deploy Previews": "deploy-preview",
  "Production": "production"
}

export {
  contextNetlifyMapping,
  envMapping,
  integrationSlugNameMapping,
  reverseContextNetlifyMapping,
  reverseEnvMapping
}
