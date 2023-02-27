export type CreateLicenseDTO = {
    email: string;
    organizationId: string;
}

type LicenseKeyData = {
  _id: string;
  plan: string;
  seats: number;
  createdAt: string;
  updatedAt: string;
}

type PlanFeatures = {
  [key: string]: {
    enabled: boolean;
    limit?: number | null;
  }
}

export type LicenseInfo = {
  _id: string;
  type: 'organization' | 'additional';
  licenseKeyData: LicenseKeyData;
  planFeatures: PlanFeatures;
}