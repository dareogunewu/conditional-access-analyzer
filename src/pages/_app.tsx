import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../lib/msalConfig';
import { ThemeProvider } from '../contexts/ThemeContext';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

const msalInstance = new PublicClientApplication(msalConfig);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MsalProvider instance={msalInstance}>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </MsalProvider>
  );
}

export default MyApp;
