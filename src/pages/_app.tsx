import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../lib/msalConfig';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

const msalInstance = new PublicClientApplication(msalConfig);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MsalProvider instance={msalInstance}>
      <Component {...pageProps} />
    </MsalProvider>
  );
}

export default MyApp;