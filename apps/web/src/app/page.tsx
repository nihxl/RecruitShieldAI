import { Metadata } from 'next';
import VerifyClient from './VerifyClient';

export const metadata: Metadata = {
  title: 'Verify Job Offer',
};

export default function VerifyPage() {
  return <VerifyClient appMode={process.env.APP_MODE} />;
}
