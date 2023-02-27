import request from '../../config/request';
import { LICENSE_SRV_KEY, LICENSE_SRV_URL } from '../../config'; 

/**
 * Provision a new license for customer with name [name] and description [description].
 * @param {Object} obj
 * @param {String} obj.email - email to associate with stripe customer for license
 * @param {String} obj.description - description to associate with stripe customer for license
 * @returnse
 */
const createLicenseKeyHelper = async ({
    email,
    description
}: {
    email: string;
    description: string;
}) => {
    
    const licenseKey = await request.post(
          `${LICENSE_SRV_URL}/api/v1/license-key`,
          {
            email,
            description
          },
          {
            headers: {
              "X-API-Key": LICENSE_SRV_KEY,
              "Content-Type": "application/json",
            },
          }
        );
    
    return licenseKey;
}

export {
    createLicenseKeyHelper
}