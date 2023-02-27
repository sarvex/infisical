import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@app/config/request';

import {
    CreateLicenseDTO,
    LicenseInfo} from './types';

const licenseKeys = {
    getOrganizationLicenses: (organizationId: string) => ['licenses', { organizationId }] as const
}

const fetchOrganizationLicenses = async (organizationId: string) => {
    const { data } = await apiRequest.get<{ licenses: LicenseInfo[] }>(`/api/v2/organizations/${organizationId}/licenses`);
    return data.licenses;
}

export const useGetOrganizationLicenses = (organizationId: string) =>
    useQuery({
        queryKey: licenseKeys.getOrganizationLicenses(organizationId),
        queryFn: () => fetchOrganizationLicenses(organizationId),
        enabled: Boolean(organizationId)
    });

export const useCreateLicense = () => {
    const queryClient = useQueryClient();
    return useMutation<{ data: { licenseInfo: LicenseInfo }}, {}, CreateLicenseDTO>({
        mutationFn: ({ organizationId, email }) =>
            apiRequest.post(`/api/v2/license`, {
                organizationId,
                email
            }),
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries(licenseKeys.getOrganizationLicenses(organizationId));
        }
    })
}