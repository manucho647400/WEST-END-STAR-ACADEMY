import { getGoogleAccessToken, signInWithGoogleWorkspace, signOutGoogleWorkspace } from './googleAuthService';

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  bodyHtml?: string;
  bodyText?: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  isHtml?: boolean;
}

const getActiveToken = (token?: string): string => {
  const t = token || getGoogleAccessToken();
  if (!t) {
    throw new Error('Not authenticated with Gmail. Please sign in with your Google account.');
  }
  return t;
};

/**
 * Base64 URL safe encoder supporting Unicode characters
 */
const encodeBase64Url = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Base64 URL safe decoder supporting Unicode characters
 */
const decodeBase64Url = (str: string): string => {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  }
};

/**
 * Fetch authenticated user's Gmail profile information
 */
export const getGmailProfile = async (token?: string): Promise<GmailProfile> => {
  const t = getActiveToken(token);
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${t}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Gmail profile (${res.status})`);
  }

  return await res.json();
};

/**
 * List messages in Gmail
 */
export const listGmailMessages = async (options: {
  q?: string;
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
  token?: string;
} = {}): Promise<{ messages: GmailMessageItem[]; nextPageToken?: string }> => {
  const t = getActiveToken(options.token);
  const params = new URLSearchParams();
  if (options.q) params.set('q', options.q);
  params.set('maxResults', String(options.maxResults || 20));
  if (options.pageToken) params.set('pageToken', options.pageToken);
  if (options.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach(id => params.append('labelIds', id));
  }

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${t}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list Gmail messages (${res.status})`);
  }

  const data = await res.json();
  const rawList: { id: string; threadId: string }[] = data.messages || [];

  // Fetch header snippets for the messages in parallel (up to maxResults)
  const detailPromises = rawList.slice(0, 15).map(async (item) => {
    try {
      return await getGmailMessage(item.id, options.token, 'METADATA');
    } catch {
      return { id: item.id, threadId: item.threadId, subject: '(Unable to load message details)' };
    }
  });

  const detailedMessages = await Promise.all(detailPromises);

  return {
    messages: detailedMessages,
    nextPageToken: data.nextPageToken,
  };
};

/**
 * Retrieve a specific message by ID
 */
export const getGmailMessage = async (
  messageId: string,
  token?: string,
  format: 'FULL' | 'METADATA' | 'MINIMAL' = 'FULL'
): Promise<GmailMessageItem> => {
  const t = getActiveToken(token);
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=${format}`,
    {
      headers: { Authorization: `Bearer ${t}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to retrieve message ${messageId}`);
  }

  const data = await res.json();
  const headers: GmailMessageHeader[] = data.payload?.headers || [];

  const getHeader = (name: string): string => {
    const found = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
    return found ? found.value : '';
  };

  let bodyHtml = '';
  let bodyText = '';

  const extractBody = (part: any) => {
    if (!part) return;
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText = decodeBase64Url(part.body.data);
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = decodeBase64Url(part.body.data);
    }
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(extractBody);
    }
  };

  if (format === 'FULL' && data.payload) {
    extractBody(data.payload);
  }

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet,
    internalDate: data.internalDate,
    labelIds: data.labelIds,
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject') || '(No Subject)',
    date: getHeader('Date'),
    bodyHtml: bodyHtml || undefined,
    bodyText: bodyText || (!bodyHtml ? data.snippet : undefined),
  };
};

/**
 * Construct raw RFC 2822 email message
 */
const createRawEmailString = (payload: SendEmailPayload, senderEmail?: string): string => {
  const headers = [
    `To: ${payload.to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`,
    'MIME-Version: 1.0',
  ];

  if (senderEmail) {
    headers.push(`From: ${senderEmail}`);
  }
  if (payload.cc) {
    headers.push(`Cc: ${payload.cc}`);
  }
  if (payload.bcc) {
    headers.push(`Bcc: ${payload.bcc}`);
  }

  const isHtml = payload.isHtml !== false;
  if (isHtml) {
    headers.push('Content-Type: text/html; charset=UTF-8');
  } else {
    headers.push('Content-Type: text/plain; charset=UTF-8');
  }

  return `${headers.join('\r\n')}\r\n\r\n${payload.body}`;
};

/**
 * Send an email directly via Gmail API.
 * An explicit user confirmation dialog MUST be shown in UI before invoking this function.
 */
export const sendGmailEmail = async (
  payload: SendEmailPayload,
  token?: string
): Promise<{ id: string; threadId: string }> => {
  const t = getActiveToken(token);
  const rawEmail = createRawEmailString(payload);
  const encodedRaw = encodeBase64Url(rawEmail);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedRaw }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email to ${payload.to} (${res.status})`);
  }

  return await res.json();
};

/**
 * Create a draft message in Gmail
 */
export const createGmailDraft = async (
  payload: SendEmailPayload,
  token?: string
): Promise<{ id: string; message: { id: string } }> => {
  const t = getActiveToken(token);
  const rawEmail = createRawEmailString(payload);
  const encodedRaw = encodeBase64Url(rawEmail);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw: encodedRaw } }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Gmail draft');
  }

  return await res.json();
};

/**
 * Delete a message from Gmail.
 * User confirmation MUST be obtained in UI before invoking this method.
 */
export const deleteGmailMessage = async (messageId: string, token?: string): Promise<boolean> => {
  const t = getActiveToken(token);
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${t}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete message ${messageId}`);
  }

  return true;
};

// ==========================================
// CBC School Specific Email Template Helpers
// ==========================================

export interface SchoolFeeNoticeParams {
  studentName: string;
  regNo: string;
  grade: string;
  term: string;
  year: number;
  balanceAmount: number;
  dueDate: string;
  parentEmail: string;
  parentName?: string;
  paybill?: string;
  accountNumber?: string;
}

export const generateFeeNoticeEmail = (params: SchoolFeeNoticeParams): SendEmailPayload => {
  const paybill = params.paybill || '247247';
  const account = params.accountNumber || `WESA-${params.regNo}`;
  const salutation = params.parentName ? `Dear Parent / Guardian (${params.parentName}),` : 'Dear Parent / Guardian,';

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
      <div style="text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #065f46; font-size: 20px; font-weight: 800; text-transform: uppercase;">West End Star Academy</h2>
        <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">Competency-Based Curriculum (CBC) · Republic of Kenya</p>
      </div>

      <p style="font-size: 14px; font-weight: 600;">${salutation}</p>
      <p style="font-size: 14px; line-height: 1.6;">
        We present warm greetings from West End Star Academy. This is an official notice regarding the fee statement and term balance for your child:
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Learner Name:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.studentName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Admission / Reg No:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.regNo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Grade / Level:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.grade}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Academic Period:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.term} (${params.year})</td>
          </tr>
          <tr style="border-top: 1px solid #cbd5e1;">
            <td style="padding: 10px 0; color: #b91c1c; font-weight: bold; font-size: 15px;">Outstanding Balance:</td>
            <td style="padding: 10px 0; font-weight: 900; color: #b91c1c; font-size: 16px;">KES ${params.balanceAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Required Clearance By:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.dueDate}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; font-weight: bold;">Official M-Pesa Payment Procedure:</h4>
        <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #064e3b; line-height: 1.6;">
          <li>Go to M-Pesa Menu on your Safaricom SIM.</li>
          <li>Select <strong>Lipa Na M-Pesa</strong> &gt; <strong>Paybill</strong>.</li>
          <li>Enter Business No: <strong>${paybill}</strong>.</li>
          <li>Enter Account No: <strong>${account}</strong>.</li>
          <li>Enter Amount: <strong>KES ${params.balanceAmount.toLocaleString()}</strong> and input your PIN.</li>
        </ol>
      </div>

      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        Kindly note that promptly clearing balances enables smooth academic learning and ensures uninterrupted CBC formative assessments and co-curricular programs.
      </p>

      <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #64748b;">
        <p style="margin: 0; font-weight: 700; color: #0f172a;">West End Star Academy Administration</p>
        <p style="margin: 2px 0 0;">Finance & Bursary Office · Official CBC Communications</p>
        <p style="margin: 2px 0 0;">Tel: +254 700 000 000 · Nairobi, Kenya</p>
      </div>
    </div>
  `;

  return {
    to: params.parentEmail,
    subject: `Fee Statement Notice: ${params.studentName} (${params.regNo}) - ${params.term} ${params.year}`,
    body: htmlBody,
    isHtml: true,
  };
};

export interface SchoolCbcReportNoticeParams {
  studentName: string;
  regNo: string;
  grade: string;
  term: string;
  rubricLevel: string;
  overallScore: number;
  rank?: number;
  totalStudents?: number;
  teacherRemarks?: string;
  parentEmail: string;
}

export const generateCbcProgressEmail = (params: SchoolCbcReportNoticeParams): SendEmailPayload => {
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
      <div style="text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #065f46; font-size: 20px; font-weight: 800; text-transform: uppercase;">West End Star Academy</h2>
        <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">CBC Learner Competency Evaluation Brief · Republic of Kenya</p>
      </div>

      <p style="font-size: 14px; font-weight: 600;">Dear Parent / Guardian,</p>
      <p style="font-size: 14px; line-height: 1.6;">
        We are pleased to share the summary of <strong>${params.studentName}</strong>'s performance in the <strong>${params.term}</strong> Competency-Based Assessment:
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Learner Name:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.studentName} (${params.regNo})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Grade / Class:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.grade}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Cumulative Score:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #047857;">${params.overallScore} Marks</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">CBC Performance Band:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #065f46;">${params.rubricLevel}</td>
          </tr>
          ${params.rank ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Class Cohort Rank:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">Position ${params.rank} ${params.totalStudents ? `of ${params.totalStudents}` : ''}</td>
          </tr>
          ` : ''}
          ${params.teacherRemarks ? `
          <tr style="border-top: 1px solid #cbd5e1;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;" colspan="2">
              <span style="display: block; font-weight: bold; color: #334155; margin-bottom: 4px;">Facilitator Remarks:</span>
              <span style="font-style: italic; color: #1e293b;">"${params.teacherRemarks}"</span>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        You can review and download the full certified CBC Report Card via our official School Portal or Google Drive archive.
      </p>

      <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #64748b;">
        <p style="margin: 0; font-weight: 700; color: #0f172a;">West End Star Academy Academic Board</p>
        <p style="margin: 2px 0 0;">Competency-Based Assessment Registry · Nairobi, Kenya</p>
      </div>
    </div>
  `;

  return {
    to: params.parentEmail,
    subject: `CBC Academic Assessment Brief: ${params.studentName} - ${params.term}`,
    body: htmlBody,
    isHtml: true,
  };
};
