import express from 'express';
const router = express.Router();
import {
    requireAuth,
    requireOrganizationAuth,
    requireLicenseAuth,
    validateRequest
} from '../../middleware';
import { licenseController } from '../../controllers/v2';
import {
    body,
    param
} from 'express-validator';
import {
    OWNER,
    ADMIN,
    MEMBER,
    ACCEPTED
} from '../../variables';

router.post(
    '/',
    body('organizationId').exists().isString().trim(),
    body('email').exists().isString().trim(),
    validateRequest,
    requireAuth({
        acceptedAuthModes: ['jwt', 'apiKey']
    }),
    requireOrganizationAuth({
		acceptedRoles: [OWNER, ADMIN, MEMBER],
		acceptedStatuses: [ACCEPTED],
        location: 'body'
	}),
    licenseController.createAdditionalLicense
);

router.get(
    '/:licenseId',
    param('licenseId').exists().trim(),
    validateRequest,
    requireAuth({
        acceptedAuthModes: ['jwt', 'apiKey']
    }),
    requireLicenseAuth({
		acceptedRoles: [OWNER, ADMIN, MEMBER],
		acceptedStatuses: [ACCEPTED]
	}),
    licenseController.getLicenseById
);

export default router;