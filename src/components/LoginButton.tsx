import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../lib/msalConfig';

const LoginButton: React.FC = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error(e);
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Sign in with Microsoft
    </button>
  );
};

export default LoginButton;