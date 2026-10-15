import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export interface EmailResult {
  success: boolean;
  error?: string;
}

export interface CaptainContact {
  name: string;
  email: string;
}

export interface MatchRoomDetails {
  matchName: string;
  roomId: string;
  roomPassword: string;
  mapName: string;
  scheduledTime: string;
}

async function sendSafeEmail(templateParams: Record<string, unknown>): Promise<EmailResult> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    return { success: true };
  }
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send email notification';
    console.warn('EmailJS delivery warning:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function sendRegistrationReceived(
  captain: CaptainContact,
  teamName: string,
  tournamentName: string
): Promise<EmailResult> {
  return sendSafeEmail({
    to_name: captain.name,
    to_email: captain.email,
    subject: `Registration Received - ${teamName} [${tournamentName}]`,
    message: `Hello ${captain.name},\n\nYour registration for team "${teamName}" in "${tournamentName}" has been received. Our admins are reviewing your roster details and UPI payment verification.\n\nYou will receive a notification once verified.`,
  });
}

export async function sendRegistrationApproved(
  captain: CaptainContact,
  teamName: string,
  tournamentName: string
): Promise<EmailResult> {
  return sendSafeEmail({
    to_name: captain.name,
    to_email: captain.email,
    subject: `Approved: Slot Confirmed for ${teamName}!`,
    message: `Congratulations ${captain.name}!\n\nYour team "${teamName}" has been approved for "${tournamentName}". Your tournament slot is now confirmed.\n\nKeep an eye on the schedule and room credentials on the live dashboard.`,
  });
}

export async function sendRegistrationRejected(
  captain: CaptainContact,
  teamName: string,
  reason: string
): Promise<EmailResult> {
  return sendSafeEmail({
    to_name: captain.name,
    to_email: captain.email,
    subject: `Registration Update: ${teamName}`,
    message: `Hello ${captain.name},\n\nYour registration for "${teamName}" could not be approved due to the following reason:\n\n"${reason}"\n\nPlease contact tournament support or re-apply with valid details.`,
  });
}

export async function sendPaymentVerified(
  captain: CaptainContact,
  teamName: string,
  amount: number
): Promise<EmailResult> {
  return sendSafeEmail({
    to_name: captain.name,
    to_email: captain.email,
    subject: `Payment Verified: ₹${amount} for ${teamName}`,
    message: `Hello ${captain.name},\n\nYour tournament entry fee of ₹${amount} for team "${teamName}" has been verified successfully.`,
  });
}

export async function sendPaymentFailed(
  captain: CaptainContact,
  teamName: string,
  reason: string
): Promise<EmailResult> {
  return sendSafeEmail({
    to_name: captain.name,
    to_email: captain.email,
    subject: `Payment Verification Issue: ${teamName}`,
    message: `Hello ${captain.name},\n\nWe could not verify the payment for team "${teamName}".\nReason: "${reason}".\nPlease contact admin with your valid UPI transaction receipt.`,
  });
}

export async function sendRoomDetails(
  recipients: string[],
  details: MatchRoomDetails
): Promise<EmailResult> {
  if (recipients.length === 0) return { success: true };
  return sendSafeEmail({
    to_email: recipients.join(','),
    subject: `Room Credentials: ${details.matchName}`,
    message: `Room ID: ${details.roomId}\nPassword: ${details.roomPassword}\nMap: ${details.mapName}\nScheduled: ${details.scheduledTime}\n\nPlease join promptly at least 10 minutes prior to match launch.`,
  });
}

export async function sendAdminAlert(
  adminEmail: string,
  subject: string,
  body: string
): Promise<EmailResult> {
  return sendSafeEmail({
    to_email: adminEmail,
    subject: `[ADMIN ALERT] ${subject}`,
    message: body,
  });
}
