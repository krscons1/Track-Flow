import nodemailer from "nodemailer"

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    }

    this.transporter = nodemailer.createTransporter(config)
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"TrackFlow" <${process.env.SMTP_USER}>`,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      })

      console.log("Email sent successfully:", info.messageId)
      return true
    } catch (error) {
      console.error("Email sending failed:", error)
      return false
    }
  }

  generateInvitationEmail(inviterName: string, projectName: string, inviteLink: string): EmailTemplate {
    const subject = `You've been invited to join ${projectName} on TrackFlow`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px 30px; }
            .invitation-card { background: #f8fafc; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; }
            .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 TrackFlow</h1>
            </div>
            <div class="content">
              <h2>You've been invited to collaborate!</h2>
              <p>Hi there!</p>
              <p><strong>${inviterName}</strong> has invited you to join the <strong>${projectName}</strong> project on TrackFlow.</p>
              
              <div class="invitation-card">
                <h3>🎯 Ready to get started?</h3>
                <p>Join your team and start collaborating on tasks, tracking time, and achieving goals together.</p>
                <a href="${inviteLink}" class="btn">Accept Invitation</a>
              </div>
              
              <p>If you have any questions, feel free to reach out to your team leader or visit our help center.</p>
              <p>Welcome to the team!</p>
            </div>
            <div class="footer">
              <p>© 2024 TrackFlow. All rights reserved.</p>
              <p>This invitation will expire in 7 days.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      You've been invited to join ${projectName} on TrackFlow
      
      ${inviterName} has invited you to collaborate on the ${projectName} project.
      
      Accept your invitation: ${inviteLink}
      
      Welcome to the team!
      
      © 2024 TrackFlow. All rights reserved.
    `

    return { subject, html, text }
  }

  generateTaskAssignmentEmail(
    assigneeName: string,
    taskTitle: string,
    projectName: string,
    taskLink: string,
  ): EmailTemplate {
    const subject = `New task assigned: ${taskTitle}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Assignment</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #10b981, #3b82f6); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px 30px; }
            .task-card { background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 30px; margin: 20px 0; }
            .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Task Assignment</h1>
            </div>
            <div class="content">
              <h2>Hi ${assigneeName}!</h2>
              <p>You have been assigned a new task in the <strong>${projectName}</strong> project.</p>
              
              <div class="task-card">
                <h3>✅ ${taskTitle}</h3>
                <p>Click below to view task details, add comments, and start working.</p>
                <a href="${taskLink}" class="btn">View Task</a>
              </div>
              
              <p>Need help? Contact your team leader or check the project documentation.</p>
            </div>
            <div class="footer">
              <p>© 2024 TrackFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      New task assigned: ${taskTitle}
      
      Hi ${assigneeName}!
      
      You have been assigned a new task in the ${projectName} project.
      
      Task: ${taskTitle}
      
      View task details: ${taskLink}
      
      © 2024 TrackFlow. All rights reserved.
    `

    return { subject, html, text }
  }

  generateDeadlineReminderEmail(userName: string, taskTitle: string, dueDate: string, taskLink: string): EmailTemplate {
    const subject = `⏰ Deadline reminder: ${taskTitle}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Deadline Reminder</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px 30px; }
            .reminder-card { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; }
            .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Deadline Reminder</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              <p>This is a friendly reminder about an upcoming deadline.</p>
              
              <div class="reminder-card">
                <h3>📅 ${taskTitle}</h3>
                <p><strong>Due: ${dueDate}</strong></p>
                <p>Don't forget to complete this task before the deadline!</p>
                <a href="${taskLink}" class="btn">View Task</a>
              </div>
              
              <p>Need an extension? Contact your team leader as soon as possible.</p>
            </div>
            <div class="footer">
              <p>© 2024 TrackFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      Deadline Reminder: ${taskTitle}
      
      Hi ${userName}!
      
      This is a friendly reminder about an upcoming deadline.
      
      Task: ${taskTitle}
      Due: ${dueDate}
      
      View task: ${taskLink}
      
      © 2024 TrackFlow. All rights reserved.
    `

    return { subject, html, text }
  }
}

export const emailService = new EmailService()
