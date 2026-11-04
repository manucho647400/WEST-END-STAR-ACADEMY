import { getGoogleAccessToken } from './googleAuthService';

export interface GoogleContact {
  resourceName: string;
  etag?: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  phoneNumber?: string;
  organization?: string;
  jobTitle?: string;
  photoUrl?: string;
}

export interface CreateContactPayload {
  givenName: string;
  familyName?: string;
  email?: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
}

const getActiveToken = (token?: string): string => {
  const t = token || getGoogleAccessToken();
  if (!t) {
    throw new Error('Not authenticated with Google. Please sign in with your Google account to access Contacts.');
  }
  return t;
};

/**
 * Fetch contacts from Google People API
 */
export const fetchGoogleContacts = async (token?: string): Promise<GoogleContact[]> => {
  const authToken = getActiveToken(token);
  const url = 'https://people.googleapis.com/v1/people/me/connections?pageSize=100&personFields=names,emailAddresses,phoneNumbers,organizations,photos';
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch contacts: ${response.statusText}`);
  }

  const data = await response.json();
  const connections = data.connections || [];

  return connections.map((c: any): GoogleContact => {
    const primaryName = c.names?.[0];
    const primaryEmail = c.emailAddresses?.[0];
    const primaryPhone = c.phoneNumbers?.[0];
    const primaryOrg = c.organizations?.[0];
    const primaryPhoto = c.photos?.[0];

    return {
      resourceName: c.resourceName,
      etag: c.etag,
      displayName: primaryName?.displayName || primaryEmail?.value || 'Unnamed Contact',
      givenName: primaryName?.givenName || '',
      familyName: primaryName?.familyName || '',
      email: primaryEmail?.value,
      phoneNumber: primaryPhone?.value,
      organization: primaryOrg?.name,
      jobTitle: primaryOrg?.title,
      photoUrl: primaryPhoto?.url
    };
  });
};

/**
 * Create a new contact in Google Contacts
 */
export const createGoogleContact = async (
  payload: CreateContactPayload,
  token?: string
): Promise<GoogleContact> => {
  const authToken = getActiveToken(token);
  const url = 'https://people.googleapis.com/v1/people:createContact';

  const body: any = {
    names: [
      {
        givenName: payload.givenName,
        familyName: payload.familyName || ''
      }
    ]
  };

  if (payload.email) {
    body.emailAddresses = [{ value: payload.email, type: 'work' }];
  }

  if (payload.phone) {
    body.phoneNumbers = [{ value: payload.phone, type: 'mobile' }];
  }

  if (payload.organization || payload.jobTitle) {
    body.organizations = [
      {
        name: payload.organization || 'West End Star Academy',
        title: payload.jobTitle || 'Guardian / Parent'
      }
    ];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to create contact: ${response.statusText}`);
  }

  const c = await response.json();
  const primaryName = c.names?.[0];
  const primaryEmail = c.emailAddresses?.[0];
  const primaryPhone = c.phoneNumbers?.[0];
  const primaryOrg = c.organizations?.[0];

  return {
    resourceName: c.resourceName,
    etag: c.etag,
    displayName: primaryName?.displayName || payload.givenName,
    givenName: primaryName?.givenName,
    familyName: primaryName?.familyName,
    email: primaryEmail?.value || payload.email,
    phoneNumber: primaryPhone?.value || payload.phone,
    organization: primaryOrg?.name || payload.organization,
    jobTitle: primaryOrg?.title || payload.jobTitle
  };
};

/**
 * Delete a contact from Google Contacts
 */
export const deleteGoogleContact = async (resourceName: string, token?: string): Promise<void> => {
  const authToken = getActiveToken(token);
  const url = `https://people.googleapis.com/v1/${resourceName}:deleteContact`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to delete contact: ${response.statusText}`);
  }
};
