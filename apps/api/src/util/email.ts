import nodemailer from "nodemailer";
import path from "path";
import pug from "pug";

const ICLOUD_USER = process.env.ICLOUD_USER as string;
const ICLOUD_PASSWORD = process.env.ICLOUD_PASSWORD as string;
const EMAIL_FROM = process.env.EMAIL_FROM as string;

interface SendInvitationEmailParams {
    email: string;
    invitedByUsername: string;
    invitedByEmail: string;
    teamName: string;
    inviteLink: string;
}

const transporter = nodemailer.createTransport({
    host: "smtp.mail.me.com",
    port: 587,
    auth: {
        type: "login",
        user: ICLOUD_USER,
        pass: ICLOUD_PASSWORD,
    },
    tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
    },
});

/**
 * Sends an invitation email to join a team
 * @param params The email parameters
 * @returns Object indicating success/failure and message ID if successful
 */
export const sendInvitationEmail = async (params: SendInvitationEmailParams) => {
    try {
        const templatePath = path.join(__dirname, 'templates', 'invitation.pug');
        const compiledTemplate = pug.compileFile(templatePath);
        const html = compiledTemplate(params);

        const mailOptions = {
            from: EMAIL_FROM,
            to: params.email,
            subject: `Join ${params.teamName} on Supaboard`,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error('Failed to send invitation email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}; 