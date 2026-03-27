import type { User, Device } from './types';

interface EmailData {
  user: User;
  devices: Device[];
}

export class EmailService {
  private static createEmailBody(data: EmailData): string {
    const { user, devices } = data;
    const assignedDevices = devices.filter(d => d.assignedTo === user.name || d.owner === user.name);

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Radio & Command Central Login Information</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Radio & Command Central Login Information</h1>
      <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.9;">Solutions Enablement System</p>
    </div>

    <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="font-size: 16px; margin: 0 0 24px 0;">Hello <strong>${user.name}</strong>,</p>
      <p style="font-size: 16px; margin: 0 0 32px 0; line-height: 1.6;">Here is your login information for your assigned radio equipment and Command Central Aware:</p>

      <!-- Personal Information -->
      <div style="background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1e40af; display: flex; align-items: center;">
          <span style="display: inline-block; width: 24px; height: 24px; margin-right: 8px;">👤</span>
          Personal Information
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #64748b; width: 140px;">Department:</td>
            <td style="padding: 8px 0; color: #1e293b;">${user.department}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Status:</td>
            <td style="padding: 8px 0; color: #1e293b; text-transform: capitalize;">${user.status}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Region:</td>
            <td style="padding: 8px 0;">
              <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500;">
                ${user.sourceTab}
              </span>
            </td>
          </tr>
        </table>
      </div>
`;

    // Command Central Responder/CAD
    if (user.responderDeviceId || user.apxNextUnitId || user.apxN70UnitId) {
      html += `
      <div style="background: #dbeafe; border: 2px solid #93c5fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1e40af;">CommandCentral Responder/CAD</h2>
        <div style="display: grid; gap: 12px;">
`;
      if (user.responderDeviceId) {
        html += `
          <div style="background: white; border: 1px solid #93c5fd; border-radius: 6px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase; margin-bottom: 8px;">Responder Device ID</div>
            <div style="font-family: 'Courier New', monospace; font-size: 15px; color: #1e293b; font-weight: 500;">${user.responderDeviceId}</div>
          </div>
`;
      }
      if (user.apxNextUnitId) {
        html += `
          <div style="background: white; border: 1px solid #93c5fd; border-radius: 6px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase; margin-bottom: 4px;">APX Next</div>
            <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 2px;">Unit ID</div>
            <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #1e293b;">${user.apxNextUnitId}</div>
          </div>
`;
      }
      if (user.apxN70UnitId) {
        html += `
          <div style="background: white; border: 1px solid #93c5fd; border-radius: 6px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase; margin-bottom: 4px;">APX N70</div>
            <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 2px;">Unit ID</div>
            <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #1e293b;">${user.apxN70UnitId}</div>
          </div>
`;
      }
      html += `
        </div>
      </div>
`;
    }

    // Command Central Login Information
    if (user.apxNextLogin || user.apxN70Login || user.apxNextAlias || user.apxN70Alias) {
      html += `
      <div style="background: #d1fae5; border: 2px solid #6ee7b7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #047857; display: flex; align-items: center;">
          <span style="display: inline-block; width: 24px; height: 24px; margin-right: 8px;">📻</span>
          CommandCentral Login Information
        </h2>
        <div style="display: grid; gap: 12px;">
`;
      if (user.apxNextLogin || user.apxNextAlias) {
        html += `
          <div style="background: white; border: 1px solid #6ee7b7; border-radius: 6px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 8px;">APX Next</div>
`;
        if (user.apxNextLogin) {
          html += `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 2px;">Login</div>
              <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #1e293b;">${user.apxNextLogin}</div>
            </div>
`;
        }
        if (user.apxNextAlias) {
          html += `
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 2px;">Alias</div>
              <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #1e293b;">${user.apxNextAlias}</div>
            </div>
`;
        }
        html += `
          </div>
`;
      }
      if (user.apxN70Login || user.apxN70Alias) {
        html += `
          <div style="background: white; border: 1px solid #6ee7b7; border-radius: 6px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 8px;">APX N70</div>
`;
        if (user.apxN70Login) {
          html += `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 2px;">Login</div>
              <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #1e293b;">${user.apxN70Login}</div>
            </div>
`;
        }
        if (user.apxN70Alias) {
          html += `
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 2px;">Alias</div>
              <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #1e293b;">${user.apxN70Alias}</div>
            </div>
`;
        }
        html += `
          </div>
`;
      }
      html += `
        </div>
      </div>
`;
    }

    // Assigned Devices
    if (assignedDevices.length > 0) {
      html += `
      <div style="background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #059669; display: flex; align-items: center;">
          <span style="display: inline-block; width: 24px; height: 24px; margin-right: 8px;">📦</span>
          Assigned Devices (${assignedDevices.length})
        </h2>
`;
      assignedDevices.forEach((device) => {
        html += `
        <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">${device.model}</h3>
            <span style="background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;">
              ${device.category}
            </span>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 140px;">Serial Number:</td>
              <td style="padding: 6px 0; font-size: 14px; color: #1e293b; font-weight: 500;">${device.serialNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Status:</td>
              <td style="padding: 6px 0;">
                <span style="background: ${device.status === 'assigned' ? '#dbeafe' : '#f1f5f9'}; color: ${device.status === 'assigned' ? '#1e40af' : '#475569'}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                  ${device.status}
                </span>
              </td>
            </tr>
`;
        if (device.location) {
          html += `
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Location:</td>
              <td style="padding: 6px 0; font-size: 14px; color: #1e293b; font-weight: 500;">${device.location}</td>
            </tr>
`;
        }
        if (device.alias) {
          html += `
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Alias:</td>
              <td style="padding: 6px 0; font-size: 14px; color: #1e293b; font-weight: 500;">${device.alias}</td>
            </tr>
`;
        }
        html += `
          </table>
`;
        if (device.ecoId || device.chicagoId) {
          html += `
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; margin: 12px -16px -16px -16px; padding: 12px 16px; border-radius: 0 0 8px 8px;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Radio IDs</div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
`;
          if (device.ecoId) {
            html += `
              <div style="background: #d1fae5; border: 1px solid #6ee7b7; padding: 8px 12px; border-radius: 6px;">
                <span style="font-size: 12px; color: #059669; font-weight: 600;">ECO (1C1):</span>
                <span style="font-family: 'Courier New', monospace; margin-left: 6px; font-size: 14px; color: #064e3b; font-weight: 500;">${device.ecoId}</span>
              </div>
`;
          }
          if (device.chicagoId) {
            html += `
              <div style="background: #dbeafe; border: 1px solid #93c5fd; padding: 8px 12px; border-radius: 6px;">
                <span style="font-size: 12px; color: #1e40af; font-weight: 600;">Chicago (040):</span>
                <span style="font-family: 'Courier New', monospace; margin-left: 6px; font-size: 14px; color: #1e3a8a; font-weight: 500;">${device.chicagoId}</span>
              </div>
`;
          }
          html += `
            </div>
          </div>
`;
        }
        html += `
        </div>
`;
      });
      html += `
      </div>
`;
    }

    html += `
      <!-- Footer -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 32px;">
        <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #475569;">
          If you have any questions or need assistance, please contact your supervisor or IT support.
        </p>
        <p style="margin: 0; font-size: 15px; color: #64748b;">
          Best regards,<br>
          <strong style="color: #1e293b;">Solutions Enablement Team</strong>
        </p>
      </div>
    </div>

    <!-- Email Footer -->
    <div style="text-align: center; padding: 24px 20px; color: #94a3b8; font-size: 13px;">
      <p style="margin: 0;">This is an automated message from the Solutions Enablement System</p>
    </div>
  </div>
</body>
</html>
`;

    return html;
  }

  private static createEmailSubject(user: User): string {
    return `Radio & Command Central Login Information - ${user.name}`;
  }

  static async sendUserInfoEmail(
    accessToken: string,
    recipientEmail: string,
    data: EmailData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = this.createEmailSubject(data.user);
      const body = this.createEmailBody(data);

      // Create the email in RFC 2822 format with HTML
      const email = [
        `To: ${recipientEmail}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        body
      ].join('\r\n');

      // Encode the email in base64url format
      const encodedEmail = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send via Gmail API
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gmail API error:', errorData);

        // Check if it's a scope error
        if (response.status === 403) {
          return {
            success: false,
            error: 'Insufficient permissions. Please log out and log back in to grant email sending permissions.'
          };
        }

        return {
          success: false,
          error: errorData.error?.message || 'Failed to send email'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
