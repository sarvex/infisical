import * as Sentry from '@sentry/node';
import {
	ENCRYPTION_KEY,
	LICENSE_SRV_URL,
	LICENSE_SRV_KEY
} from '../config';
import { ACCEPTED } from '../variables';
import {
	Organization, 
	MembershipOrg,
	License
} from '../models';
import {
	encryptSymmetric,
	decryptSymmetric
} from '../utils/crypto';
import request from '../config/request';

/**
 * Create an organization with name [name]
 * @param {Object} obj
 * @param {String} obj.name - name of organization to create.
 * @param {String} obj.email - POC email that will receive invoice info
 * @param {Object} organization - new organization
 */
const createOrganization = async ({
	name,
	email
}: {
	name: string;
	email: string;
}) => {
	let organization;
	try {
		organization = await new Organization({
			name
		}).save();
		
		if (LICENSE_SRV_URL && LICENSE_SRV_KEY) {
			// license server URL and key exist -> create and 
			// assign new license to the organization

			const { data } = await request.post(
				`${LICENSE_SRV_URL}/api/v1/license-key`,
				{
					email,
					description: name
				},
				{
					headers: {
						'X-API-KEY': LICENSE_SRV_KEY,
						'Content-Type': 'application/json'
					}
				}
			);

			const {
				ciphertext: licenseKeyCiphertext,
				iv: licenseKeyIV, 
				tag: licenseKeyTag
			} = encryptSymmetric({
				plaintext: data.licenseKey,
				key: ENCRYPTION_KEY
			});
			
			await new License({
				organization: organization._id,
				type: 'organization',
				licenseKeyCiphertext,
				licenseKeyIV,
				licenseKeyTag
			}).save();
		}
	} catch (err) {
		Sentry.setUser({ email });
		Sentry.captureException(err);
		throw new Error(`Failed to create organization [err=${err}]`);
	}

	return organization;
};

/**
 * Update organization subscription quantity to reflect number of members in
 * the organization.
 * @param {Object} obj
 * @param {Number} obj.organizationId - id of subscription's organization
 */
const updateSubscriptionOrgQuantity = async ({
	organizationId
}: {
	organizationId: string;
}) => {
	try {
		// find organization
		const organization = await Organization.findOne({
			_id: organizationId
		});
		
		if (!organization) throw new Error('Failed to find organization to update subscription quantity');
		
		const license = await License.findOne({
			organization: organization._id,
			type: 'organization'
		});
		
		if (organization && license) {
			const quantity = await MembershipOrg.countDocuments({
				organization: organizationId,
				status: ACCEPTED
			});

			const licenseKey = decryptSymmetric({
				ciphertext: license.licenseKeyCiphertext,
				iv: license.licenseKeyIV,
				tag: license.licenseKeyTag,
				key: ENCRYPTION_KEY
			});

			await request.patch(
				`${LICENSE_SRV_URL}/api/v1/license-key/seats`,
				{
					seats: quantity
				},
				{
					headers: {
						'X-API-KEY': licenseKey,
						'Content-Type': 'application/json'
					}
				}
			);
		}
	} catch (err) {
		Sentry.setUser(null);
		Sentry.captureException(err);
	}
};

export {
	createOrganization,
	updateSubscriptionOrgQuantity
};
