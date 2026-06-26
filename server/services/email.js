import { EmailClient } from "@azure/communication-email";
import {
  tplStudentWelcome,
  tplEnrollmentConfirmation,
  tplInstructorWelcome,
  tplCourseReminder,
  tplContactInquiry,
  tplContactConfirmation,
} from "../templates/index.js";

const acsClient = process.env.ACS_CONNECTION_STRING
  ? new EmailClient(process.env.ACS_CONNECTION_STRING)
  : null;

const SENDER = process.env.ACS_SENDER_EMAIL || "noreply@techbridge.academy";

export async function sendEmail({ to, subject, html }) {
  if (!to) { console.warn("[Email] Skipped — no recipient"); return; }
  if (!acsClient) { console.warn("[Email] Skipped — ACS_CONNECTION_STRING not configured"); return; }
  try {
    console.log(`[Email] Sending "${subject}" to ${to}`);
    const poller = await acsClient.beginSend({
      senderAddress: SENDER,
      recipients: { to: [{ address: to }] },
      content: { subject, html },
    });
    const result = await poller.pollUntilDone();
    console.log(`[Email] Sent OK — messageId: ${result?.id}`);
  } catch (err) {
    console.error("[Email] Send error:", err.message, err.details ?? "");
  }
}

export {
  tplStudentWelcome,
  tplEnrollmentConfirmation,
  tplInstructorWelcome,
  tplCourseReminder,
  tplContactInquiry,
  tplContactConfirmation,
};
