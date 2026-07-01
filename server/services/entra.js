export async function getGraphToken() {
  const tenantId = process.env.ENTRA_TENANT_ID;
  const clientId = process.env.ENTRA_CLIENT_ID;
  const clientSecret = process.env.ENTRA_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;
  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );
  const { access_token } = await res.json();
  return access_token;
}

export async function deleteEntraUser(oid) {
  const token = await getGraphToken();
  if (!token) return;
  await fetch(`https://graph.microsoft.com/v1.0/users/${oid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateEntraDisplayName(oid, firstName, lastName) {
  const token = await getGraphToken();
  if (!token) return;
  await fetch(`https://graph.microsoft.com/v1.0/users/${oid}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: `${firstName} ${lastName}`,
      givenName: firstName,
      surname: lastName,
    }),
  });
}

async function getStaffGraphToken() {
  const tenantId = process.env.ENTRA_STAFF_TENANT_ID;
  const clientId = process.env.ENTRA_STAFF_CLIENT_ID;
  const clientSecret = process.env.ENTRA_STAFF_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;
  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );
  const { access_token } = await res.json();
  return access_token;
}

function buildUpn(firstName, lastName) {
  const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  return `${normalize(firstName)}.${normalize(lastName)}@techbridge.academy`;
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const rand = (n) => chars[Math.floor(Math.random() * n)];
  return `TB-${Array.from({ length: 6 }, () => rand(chars.length)).join("")}#1`;
}

export async function createEntraStaffUser(firstName, lastName) {
  const token = await getStaffGraphToken();
  if (!token) return null;
  const upn = buildUpn(firstName, lastName);
  const tempPassword = generateTempPassword();
  const res = await fetch("https://graph.microsoft.com/v1.0/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      accountEnabled: true,
      displayName: `${firstName} ${lastName}`,
      givenName: firstName,
      surname: lastName,
      userPrincipalName: upn,
      mailNickname: upn.split("@")[0],
      passwordProfile: { forceChangePasswordNextSignIn: true, password: tempPassword },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Graph API error ${res.status}`);
  }
  const user = await res.json();
  return { oid: user.id, upn, tempPassword };
}
