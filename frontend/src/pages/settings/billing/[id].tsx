import { Controller, useForm } from 'react-hook-form';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import Plan from '@app/components/billing/Plan';
import NavHeader from '@app/components/navigation/NavHeader';
import { getTranslatedServerSideProps } from '@app/components/utilities/withTranslateProps';
import {
  Button,
  FormControl,
  Input,
  Modal,
  ModalClose,
  ModalContent,
  ModalTrigger,
  Table,
  TableContainer,
  TBody,
  Td,
  Th,
  THead,
  Tr
} from '@app/components/v2';
import { useOrganization } from '@app/context';
import { usePopUp } from '@app/hooks';
import {
  useCreateLicense,
  useGetOrganizationLicenses} from '@app/hooks/api/licenses';

// TODO: send license key to email

const createLicenseSchema = yup.object({
  email: yup.string().required().label('Email'),
});

export type CreateLicense = yup.InferType<typeof createLicenseSchema>;

export default function SettingsBilling() {
  const { currentOrg } = useOrganization();
  const { data: licenses } = useGetOrganizationLicenses(localStorage.getItem('orgData.id') ?? '');
  const createLicense = useCreateLicense();

  const {
    control,
    reset,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<CreateLicense>({
    resolver: yupResolver(createLicenseSchema)
  });

  const { popUp, handlePopUpToggle } = usePopUp([
    'createLicense',
  ] as const);

  console.log('currentOrg: ', currentOrg);
  const onFormSubmit = async (data: CreateLicense) => {
    // const token = await onCreateToken(data);
    console.log('1A: ', data);
    await createLicense.mutateAsync({
      organizationId: currentOrg?._id,
      email: data.email
    });
  };
  
  const { t } = useTranslation();
  
  const currentLicenseKeyData = licenses?.find((licenseInfo) => licenseInfo.type === 'organization')?.licenseKeyData;
  const currentPlan = currentLicenseKeyData?.plan;
  const numUsers = currentLicenseKeyData?.seats;

  const plans = [
    {
      key: 1,
      name: t('billing:starter.name')!,
      price: t('billing:free')!,
      priceExplanation: t('billing:starter.price-explanation')!,
      text: t('billing:starter.text')!,
      subtext: t('billing:starter.subtext')!,
      buttonTextMain: t('billing:downgrade')!,
      buttonTextSecondary: t('billing:learn-more')!,
      current: currentPlan === 'starter'
    },
    {
      key: 2,
      name: 'Team',
      price: '$8',
      priceExplanation: t('billing:professional.price-explanation')!,
      text: 'For teams that want to improve their efficiency and security.',
      buttonTextMain: t('billing:upgrade')!,
      buttonTextSecondary: t('billing:learn-more')!,
      current: currentPlan === 'team'
    },
    {
      key: 3,
      name: t('billing:professional.name')!,
      price: '$18',
      priceExplanation: t('billing:professional.price-explanation')!,
      text: t('billing:enterprise.text')!,
      subtext: t('billing:professional.subtext')!,
      buttonTextMain: t('billing:upgrade')!,
      buttonTextSecondary: t('billing:learn-more')!,
      current: currentPlan === 'pro'
    },
    {
      key: 4,
      name: t('billing:enterprise.name')!,
      price: t('billing:custom-pricing')!,
      text: 'Boost the security and efficiency of your engineering teams.',
      buttonTextMain: t('billing:schedule-demo')!,
      buttonTextSecondary: t('billing:learn-more')!,
      current: false
    }
  ];

  console.log('licenses: ', licenses);

  return (
    <div className="bg-bunker-800 max-h-screen flex flex-col justify-between text-white">
      <Head>
        <title>{t('common:head-title', { title: t('billing:title') })}</title>
        <link rel="icon" href="/infisical.ico" />
      </Head>
      <div className="flex flex-row">
        <div className="w-full max-h-screen pb-2 overflow-y-auto">
          <NavHeader pageName={t('billing:title')} />
          <div className="ml-6 my-8 text-xl max-w-5xl">
              <p className="text-3xl font-semibold mr-4 text-gray-200">{t('billing:title')}</p>
              <p className="text-xl font-normal text-gray-400 text-base">{t('billing:description')}</p>
          </div>
          <div className="flex flex-col ml-6 text-mineshaft-50 w-max">
            <p className="text-xl font-semibold">{t('billing:subscription')}</p>
            <div className="grid grid-cols-2 grid-rows-2 gap-y-6 gap-x-3 mt-4 overflow-x-auto">
              {plans.map((plan) => (
                <Plan key={plan.name} plan={plan} />
              ))}
            </div>
            <p className="text-xl font-bold mt-12">{t('billing:current-usage')}</p>
            <div className="flex flex-row">
              {numUsers && (
                <div className="mt-4 text-gray-300 w-60 pt-6 pb-10 rounded-md bg-white/5 justify-center items-center flex flex-col">
                  <p className="text-6xl font-bold">{numUsers}</p>
                  <p className="text-gray-300">
                    {numUsers > 1 ? 'Organization members' : 'Organization member'}
                  </p>
                </div>
              )}
              {/* <div className="mr-4 mt-8 text-gray-300 w-60 pt-6 pb-10 rounded-md bg-white/5 flex justify-center items-center flex flex-col">
									<p className="text-6xl font-bold">1 </p>
									<p className="text-gray-300">Organization projects</p>
								</div> */}
            </div>
            <div className="flex w-full justify-between mt-12">
            <p className="text-xl font-bold">{t('billing:licenses')}</p>
            <Modal
              isOpen={popUp?.createLicense?.isOpen}
              onOpenChange={(open) => {
                handlePopUpToggle('createLicense', open);
                reset();
              }}
            >
              <ModalTrigger asChild>
                <Button color="mineshaft" leftIcon={<FontAwesomeIcon icon={faPlus} />}>
                  Purchase License
                </Button>
              </ModalTrigger>
              <ModalContent
                title="Purchase an Additional License"
                subTitle="A separate license is needed to unlock team, professional, or enterprise features in self-hosted Infisical. A license key with instructions will be sent to the billing email below."
              >
                <form onSubmit={handleSubmit(onFormSubmit)}>
                  <Controller
                    control={control}
                    name="email"
                    defaultValue=""
                    render={({ field, fieldState: { error } }) => (
                      <FormControl
                        label="Email"
                        isError={Boolean(error)}
                        errorText={error?.message}
                      >
                        <Input {...field} placeholder="Type your email" />
                      </FormControl>
                    )}
                  />
                    <div className="mt-8 flex items-center">
                    <Button
                      className="mr-4"
                      type="submit"
                      isDisabled={isSubmitting}
                      isLoading={isSubmitting}
                    >
                      Create
                    </Button>
                    <ModalClose asChild>
                      <Button variant="plain" colorSchema="secondary">
                        Cancel
                      </Button>
                    </ModalClose>
                  </div>
                </form>
              </ModalContent>
            </Modal>
            </div>
            <TableContainer className="mt-4">
                <Table>
                  <THead>
                    <Tr>
                      <Th>License Key</Th>
                      <Th>Type</Th>
                      <Th>Plan</Th>
                      <Th>Seats</Th>
                      <Th>Created At</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {licenses && licenses.map((license) => {
                      return (
                        <Tr key={license._id}>
                            <Td>{license.licenseKey}</Td>
                            <Td>{license.type}</Td>
                            <Td>{license.licenseKeyData.plan}</Td>
                            <Td>{license.licenseKeyData.seats}</Td>
                            <Td>{license.licenseKeyData.createdAt}</Td>
                          </Tr>
                        );
                    })}
                  </TBody>
                </Table>
            </TableContainer> 
          </div>
        </div>
      </div>
    </div>
  );
}

SettingsBilling.requireAuth = true;

export const getServerSideProps = getTranslatedServerSideProps(['settings', 'billing']);
