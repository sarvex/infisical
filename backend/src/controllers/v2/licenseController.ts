import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import {
    License
} from '../../models';
import {
    ENCRYPTION_KEY,
    LICENSE_SRV_KEY,
    LICENSE_SRV_URL
} from '../../config';
import request from '../../config/request';
import {
    encryptSymmetric,
    decryptSymmetric
} from '../../utils/crypto';
import { sendMail } from '../../helpers/nodemailer';

/**
 * Create an additional (self-hosted) license for organization with id [organizationId]
 * with name [name] and description [description] - TODO: decide how
 * @param req
 * @param res 
 */
export const createAdditionalLicense = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const { data } = await request.post(
            `${LICENSE_SRV_URL}/api/v1/license-key`,
            {
                email,
                description: req.membershipOrg.organization.name
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
        
        const license = await new License({
            organization: req.membershipOrg.organization._id,
            type: 'additional',
            licenseKeyCiphertext,
            licenseKeyIV,
            licenseKeyTag
        }).save();
        
        await sendMail({
            template: 'newLicenseKey.handlebars',
            subjectLine: 'Your new license Key',
            recipients: [email],
            substitutions: {
                licenseKey: data.licenseKey
            }
        });
        
        return res.status(200).send({
            _id: license._id,
            type: license.type,
            ...data
        });
        
    } catch (err) {
        Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
        return res.status(400).send('Failed to create additional license');
    }
}

/**
 * Return license with id [licenseId]
 * @param req 
 * @param res 
 */
export const getLicenseById = async (req: Request, res: Response) => {
    try {
        const licenseKey = decryptSymmetric({
            ciphertext: req.license.licenseKeyCiphertext,
            iv: req.license.licenseKeyIV,
            tag: req.license.licenseKeyTag,
            key: ENCRYPTION_KEY
        });

        const { data } = await request.get(
            `${LICENSE_SRV_URL}/api/v1/license-key`,
            {
                headers: {
                    'X-API-KEY': licenseKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        return res.status(200).send({
            _id: req.license._id,
            type: req.license.type,
            ...data
        });
    } catch (err) {
        Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
        return res.status(400).send('Failed to get license by id');
    }
}