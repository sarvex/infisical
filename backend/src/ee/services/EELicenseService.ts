import { LICENSE_KEY } from '../../config';
import { createLicenseKeyHelper } from '../helpers/license';

/**
 * Class to handle Enterprise Edition license actions
 * TODO: re-think this class
 */
class EELicenseService {
    
    private readonly _isLicenseValid: boolean;
    
    constructor(licenseKey: string) {
        this._isLicenseValid = true;
    }
    
    public static createLicenseKey({
        email,
        description
    }: {
        email: string;
        description: string;
    }): void {
        
        createLicenseKeyHelper({
            email,
            description
        });
    }

    public get isLicenseValid(): boolean {
        return this._isLicenseValid;
    }
}

export default new EELicenseService(LICENSE_KEY);