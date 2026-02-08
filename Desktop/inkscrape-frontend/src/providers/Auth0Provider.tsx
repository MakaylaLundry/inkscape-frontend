import { Auth0Provider as Auth0ProviderBase } from "@auth0/auth0-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface Auth0ProviderProps {
  children: ReactNode;
}

export function Auth0ProviderWithNavigate({ children }: Auth0ProviderProps) {
  const navigate = useNavigate();

  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

  const onRedirectCallback = (appState?: { returnTo?: string }) => {
    navigate(appState?.returnTo || "/onboarding");
  };

  if (!domain || !clientId) {
    console.error("Auth0 configuration missing. Please set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID");
    return <>{children}</>;
  }

  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  return (
    <Auth0ProviderBase
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0ProviderBase>
  );
}
