// src/services/functionsClient.ts

const SUPABASE_URL = 'https://bnulrjswcuoflzyvgain.supabase.co';
// Replace the line below with your actual anon key from Supabase
const SUPABASE_ANON_KEY = 'sb_publishable_hKKjb71GvApCMZa_wTWxBw_bRou2eAD'; 

/**
 * Sends an email using the Supabase Edge Function we just deployed.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ to, subject, html })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Supabase function:', error);
    throw error;
  }
}