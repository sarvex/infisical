import { Request, Response } from 'express';
import { Types } from 'mongoose';
import * as Sentry from '@sentry/node';
import { 
    MembershipOrg,
    Membership,
    Workspace,
    License
} from '../../models';
import { deleteMembershipOrg } from '../../helpers/membershipOrg';
import { updateSubscriptionOrgQuantity } from '../../helpers/organization';
import {
    ENCRYPTION_KEY,
    LICENSE_SRV_URL
} from '../../config';
import {
    decryptSymmetric
} from '../../utils/crypto';
import request from '../../config/request';

/**
 * Return memberships for organization with id [organizationId]
 * @param req 
 * @param res 
 */
export const getOrganizationMemberships = async (req: Request, res: Response) => {
    /* 
    #swagger.summary = 'Return organization memberships'
    #swagger.description = 'Return organization memberships'
    
    #swagger.security = [{
        "apiKeyAuth": []
    }]

	#swagger.parameters['organizationId'] = {
		"description": "ID of organization",
		"required": true,
		"type": "string"
	} 

    #swagger.responses[200] = {
        content: {
            "application/json": {
                "schema": { 
                    "type": "object",
					"properties": {
						"memberships": {
							"type": "array",
							"items": {
								$ref: "#/components/schemas/MembershipOrg" 
							},
							"description": "Memberships of organization"
						}
					}
                }
            }           
        }
    }   
    */
    let memberships;
    try {
        const { organizationId } = req.params;

		memberships = await MembershipOrg.find({
			organization: organizationId
		}).populate('user', '+publicKey');
    } catch (err) {
        Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to get organization memberships'
		});
    }
    
    return res.status(200).send({
        memberships
    });
}

/**
 * Update role of membership with id [membershipId] to role [role]
 * @param req 
 * @param res 
 */
export const updateOrganizationMembership = async (req: Request, res: Response) => {
    /* 
    #swagger.summary = 'Update organization membership'
    #swagger.description = 'Update organization membership'
    
    #swagger.security = [{
        "apiKeyAuth": []
    }]

	#swagger.parameters['organizationId'] = {
		"description": "ID of organization",
		"required": true,
		"type": "string"
	} 

	#swagger.parameters['membershipId'] = {
		"description": "ID of organization membership to update",
		"required": true,
		"type": "string"
	} 

	#swagger.requestBody = {
      "required": true,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
                "role": {
                    "type": "string",
                    "description": "Role of organization membership - either owner, admin, or member",
                }
            }
          }
        }
      }
    }

    #swagger.responses[200] = {
        content: {
            "application/json": {
                "schema": { 
					"type": "object",
					"properties": {
						"membership": {
							$ref: "#/components/schemas/MembershipOrg",
							"description": "Updated organization membership"
						}
					}
                }
            }           
        }
    }   
    */
    let membership;
    try {
        const { membershipId } = req.params;
        const { role } = req.body;
        
        membership = await MembershipOrg.findByIdAndUpdate(
            membershipId,
            {
                role
            }, {
                new: true
            }
        );
    } catch (err) {
        Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to update organization membership'
		});
    }
    
    return res.status(200).send({
        membership
    });
}

/**
 * Delete organization membership with id [membershipId]
 * @param req 
 * @param res 
 * @returns 
 */
export const deleteOrganizationMembership = async (req: Request, res: Response) => {
    /* 
    #swagger.summary = 'Delete organization membership'
    #swagger.description = 'Delete organization membership'
    
    #swagger.security = [{
        "apiKeyAuth": []
    }]

	#swagger.parameters['organizationId'] = {
		"description": "ID of organization",
		"required": true,
		"type": "string"
	} 

	#swagger.parameters['membershipId'] = {
		"description": "ID of organization membership to delete",
		"required": true,
		"type": "string"
	} 

    #swagger.responses[200] = {
        content: {
            "application/json": {
                "schema": { 
					"type": "object",
					"properties": {
						"membership": {
							$ref: "#/components/schemas/MembershipOrg",
							"description": "Deleted organization membership"
						}
					}
                }
            }           
        }
    }   
    */
    let membership;
    try {
        const { membershipId } = req.params;
        
        // delete organization membership
        membership = await deleteMembershipOrg({
            membershipOrgId: membershipId
        });

        await updateSubscriptionOrgQuantity({
			organizationId: membership.organization.toString()
		});
    } catch (err) {
        Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to delete organization membership'
		});	
    }

    return res.status(200).send({
        membership
    });
}

/**
 * Return workspaces for organization with id [organizationId] that user has
 * access to
 * @param req 
 * @param res 
 */
export const getOrganizationWorkspaces = async (req: Request, res: Response) => {
    /* 
    #swagger.summary = 'Return projects in organization that user is part of'
    #swagger.description = 'Return projects in organization that user is part of'
    
    #swagger.security = [{
        "apiKeyAuth": []
    }]

	#swagger.parameters['organizationId'] = {
		"description": "ID of organization",
		"required": true,
		"type": "string"
	} 

    #swagger.responses[200] = {
        content: {
            "application/json": {
                "schema": { 
                    "type": "object",
					"properties": {
						"workspaces": {
							"type": "array",
							"items": {
								$ref: "#/components/schemas/Project" 
							},
							"description": "Projects of organization"
						}
					}
                }
            }           
        }
    }   
    */
    let workspaces;
    try {
        const { organizationId } = req.params;

		const workspacesSet = new Set(
			(
				await Workspace.find(
					{
						organization: organizationId
					},
					'_id'
				)
			).map((w) => w._id.toString())
		);

		workspaces = (
			await Membership.find({
				user: req.user._id
			}).populate('workspace')
		)
			.filter((m) => workspacesSet.has(m.workspace._id.toString()))
			.map((m) => m.workspace);
    } catch (err) {
        Sentry.setUser({ email: req.user.email });
		Sentry.captureException(err);
		return res.status(400).send({
			message: 'Failed to get organization workspaces'
		});	
    }
    
    return res.status(200).send({
        workspaces
    });
}

/**
 * Return licenses for organization with id [organizationId]
 * @param req 
 * @param res 
 */
export const getOrganizationLicenses = async (req: Request, res: Response) => {
    const licenses = [];
    try {
        const { organizationId } = req.params;

        const additionalLicenses = await License.find({
            organization: new Types.ObjectId(organizationId)
        });

        for await (const license of additionalLicenses) {
            const licenseKey = decryptSymmetric({
                ciphertext: license.licenseKeyCiphertext,
                iv: license.licenseKeyIV,
                tag: license.licenseKeyTag,
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

            licenses.push({
                _id: license._id,
                type: license.type,
                licenseKey,
                ...data
            });
        }
    } catch (err) {
        Sentry.setUser({ email: req.user.email });
        Sentry.captureException(err); 
        return res.status(400).send({
            message: 'Failed to get additional licenses for organization'
        });
    }

    return res.status(200).send({
        licenses
    });
}