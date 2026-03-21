const tenantSubdomain = import.meta.env.VITE_ENTRA_TENANT_SUBDOMAIN;

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: `https://${tenantSubdomain}.ciamlogin.com/${tenantSubdomain}.onmicrosoft.com`,
    knownAuthorities: [`${tenantSubdomain}.ciamlogin.com`],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
