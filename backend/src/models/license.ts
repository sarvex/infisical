import { Schema, model, Types, Document } from 'mongoose';

export interface ILicense extends Document {
    _id: Types.ObjectId;
    organization: Types.ObjectId;
    type: 'organization' | 'additional';
    licenseKeyCiphertext: string;
    licenseKeyIV: string;
    licenseKeyTag: string;
}

const license = new Schema<ILicense>(
    {
        organization: {
			type: Schema.Types.ObjectId,
			ref: 'Organization'
		},
        type: {
            type: String,
            required: true
        },
		licenseKeyCiphertext: {
			type: String,
            required: true
		},
		licenseKeyIV: {
			type: String,
            required: true
		},
		licenseKeyTag: {
			type: String,
		}
    },
    {
        timestamps: true
    }
);

const License = model<ILicense>('License', license);

export default License;