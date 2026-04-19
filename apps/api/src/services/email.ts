import nodemailer from "nodemailer";
import { config } from "../config";

/**
 * Premium Email Notification Service for Bloom HR
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (this.transporter) return this.transporter;

    if (!config.email.user || !config.email.pass) {
      console.warn("SMTP credentials not set; email service disabled.");
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    return this.transporter;
  }

  /**
   * Sends a beautifully formatted lead notification to the owner.
   */
  async sendNewLeadEmail(leadData: { name: string; email?: string; phone?: string; message: string }) {
    const t = this.getTransporter();
    if (!t) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          .body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #020617; color: #f8fafc; padding: 40px 20px; text-align: center; }
          .card { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 40px; text-align: left; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
          .badge { display: inline-block; padding: 6px 12px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #22c55e; border-radius: 100px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
          .heading { font-size: 24px; font-weight: 800; margin-bottom: 10px; color: #ffffff; }
          .subheading { font-size: 14px; color: #94a3b8; margin-bottom: 30px; }
          .info-box { background: #020617; border-radius: 16px; padding: 24px; margin-bottom: 30px; }
          .info-item { margin-bottom: 16px; }
          .info-label { font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-value { font-size: 15px; font-weight: 600; color: #f1f5f9; margin-top: 4px; }
          .message-box { font-size: 14px; line-height: 1.6; color: #94a3b8; padding-top: 16px; border-top: 1px solid #1e293b; }
          .btn { display: inline-block; background: linear-gradient(to right, #22c55e, #10b981); color: #ffffff !important; padding: 14px 32px; border-radius: 100px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 20px; box-shadow: 0 10px 20px rgba(34,197,94,0.2); }
          .footer { margin-top: 40px; font-size: 12px; color: #475569; text-align: center; }
        </style>
      </head>
      <body class="body">
        <div class="card">
          <div class="badge">New Inquiry</div>
          <h1 class="heading">Client Submission</h1>
          <p class="subheading">A new lead has been captured from sk-bloom-hr-solutions.netlify.app</p>
          
          <div class="info-box">
            <div class="info-item">
              <div class="info-label">Client Name</div>
              <div class="info-value">${leadData.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contact Details</div>
              <div class="info-value">
                ${leadData.email ? `✉️ ${leadData.email}<br/>` : ""}
                ${leadData.phone ? `📞 ${leadData.phone}` : ""}
              </div>
            </div>
            <div class="message-box">
              <div class="info-label" style="margin-bottom:8px">Message</div>
              ${leadData.message.replace(/\n/g, "<br/>")}
            </div>
          </div>

          <a href="https://sk-bloom-hr-solutions.netlify.app/admin" class="btn">View in Admin Panel</a>
        </div>
        <div class="footer">
          © 2026 Bloom HR Solutions · Automatic System Notification
        </div>
      </body>
      </html>
    `;

    try {
      await t.sendMail({
        from: `"Bloom HR Support" <${config.email.from}>`,
        to: config.email.to,
        subject: `🚀 New Lead: ${leadData.name}`,
        html,
      });
      console.log(`Success: Notification email sent for lead: ${leadData.name}`);
    } catch (error) {
      console.error("Failed to send notification email:", error);
    }
  }
}

export const emailService = new EmailService();
