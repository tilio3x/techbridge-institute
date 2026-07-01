import { PublicClientApplication } from "@azure/msal-browser";

const tenantSubdomain = import.meta.env.VITE_ENTRA_TENANT_SUBDOMAIN;

// ─── Student (CIAM / External ID) ────────────────────────────────────────────
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: `https://${tenantSubdomain}.ciamlogin.com/${tenantSubdomain}.onmicrosoft.com`,
    knownAuthorities: [`${tenantSubdomain}.ciamlogin.com`],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false },
};

export const loginRequest = { scopes: ["openid", "profile", "email"] };

// ─── Staff (tidisoft.com corporate tenant) ───────────────────────────────────
export const staffMsalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_STAFF_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_STAFF_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false },
};

export const staffLoginRequest = { scopes: ["openid", "profile", "email", "User.Read"] };

export const staffMsalInstance = new PublicClientApplication(staffMsalConfig);
