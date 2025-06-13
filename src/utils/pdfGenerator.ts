// src/utils/pdfGenerator.ts
// PDF Generation Utility for Forms

export interface PartnershipLogData {
  first_name: string;
  last_name: string;
  organization: string;
  email: string;
  phone: string;
  families_served: string;
  events: Array<{
    date: string;
    site: string;
    hours_worked: string;
    volunteers: string;
  }>;
  prepared_by_first: string;
  prepared_by_last: string;
  position_title: string;
}

export interface ActivityLogData {
  incident_name: string;
  date_from: string;
  date_to: string;
  time_from: string;
  time_to: string;
  prepared_by_first: string;
  prepared_by_last: string;
  position_title: string;
  team_members: Array<{
    name: string;
    title: string;
    organization: string;
  }>;
  activities: Array<{
    date_time: string;
    notable_activities: string;
  }>;
  is_complete: boolean;
}

export class PDFGenerator {
  private static createPrintStyles(): string {
    return `
      <style>
        @media print {
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 4px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .form-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 30px; }
          .form-section { margin-bottom: 20px; }
          .form-label { font-weight: bold; font-size: 12px; margin-bottom: 5px; }
          .form-field { border-bottom: 1px solid #000; padding: 5px 0; margin-bottom: 10px; min-height: 20px; }
          .inline-fields { display: flex; gap: 20px; }
          .inline-fields .form-field { flex: 1; }
          .checkbox-field { display: flex; align-items: center; gap: 5px; }
        }
        @page { margin: 0.5in; }
      </style>
    `;
  }

  static generatePartnershipLogPDF(data: PartnershipLogData): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Agency Partnership Volunteer Log</title>
        ${this.createPrintStyles()}
      </head>
      <body>
        <div class="form-title">AGENCY PARTNERSHIP VOLUNTEER LOG</div>
        
        <div class="form-section">
          <div class="form-label">Name *</div>
          <div class="inline-fields">
            <div class="form-field">
              ${data.first_name}
              <br><small>First Name</small>
            </div>
            <div class="form-field">
              ${data.last_name}
              <br><small>Last Name</small>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <div class="form-label">Organization *</div>
          <div class="form-field">${data.organization}</div>
        </div>
        
        <div class="form-section">
          <div class="inline-fields">
            <div>
              <div class="form-label">Email *</div>
              <div class="form-field">
                ${data.email}
                <br><small>example@example.com</small>
              </div>
            </div>
            <div>
              <div class="form-label">Phone *</div>
              <div class="form-field">
                ${data.phone}
                <br><small>(000) 000-0000</small>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <div class="form-label">Total Number of "Families" Served *</div>
          <div class="form-field">${data.families_served}</div>
        </div>
        
        <div class="form-section">
          <div class="form-label">Volunteer Hours:</div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">#</th>
                <th style="width: 25%; text-align: center;">Event Date</th>
                <th style="width: 25%; text-align: center;">Event Site Zip</th>
                <th style="width: 20%; text-align: center;">Total Number of Hours Worked</th>
                <th style="width: 20%; text-align: center;">Total Number of Volunteers</th>
              </tr>
            </thead>
            <tbody>
              ${data.events.map((event, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}.</td>
                  <td>${event.date}</td>
                  <td>${event.site}</td>
                  <td>${event.hours_worked}</td>
                  <td>${event.volunteers}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="form-section">
          <div class="form-label">Prepared By:</div>
          <div class="inline-fields">
            <div>
              <div class="form-label">First Name</div>
              <div class="form-field">${data.prepared_by_first}</div>
            </div>
            <div>
              <div class="form-label">Last Name</div>
              <div class="form-field">${data.prepared_by_last}</div>
            </div>
            <div>
              <div class="form-label">Position/Title</div>
              <div class="form-field">${data.position_title}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }

  static generateActivityLogPDF(data: ActivityLogData): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Activity Log (ICS 214)</title>
        ${this.createPrintStyles()}
      </head>
      <body>
        <div class="form-title">ACTIVITY LOG (ICS 214)</div>
        
        <div class="form-section">
          <div class="form-label">Incident Name *</div>
          <div class="form-field">${data.incident_name}</div>
        </div>
        
        <div class="form-section">
          <div class="inline-fields">
            <div>
              <div class="form-label">Date From *</div>
              <div class="form-field">
                ${data.date_from}
                <br><small>Date</small>
              </div>
            </div>
            <div>
              <div class="form-label">Date To *</div>
              <div class="form-field">
                ${data.date_to}
                <br><small>Date</small>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <div class="inline-fields">
            <div>
              <div class="form-label">Time From *</div>
              <div class="form-field">${data.time_from}</div>
            </div>
            <div>
              <div class="form-label">Time To *</div>
              <div class="form-field">${data.time_to}</div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <div class="form-label">Prepared By *</div>
          <div class="inline-fields">
            <div>
              <div class="form-field">
                ${data.prepared_by_first}
                <br><small>First Name</small>
              </div>
            </div>
            <div>
              <div class="form-field">
                ${data.prepared_by_last}
                <br><small>Last Name</small>
              </div>
            </div>
          </div>
          <div style="margin-top: 10px;">
            <div class="form-label">Your Position/Title *</div>
            <div class="form-field">${data.position_title}</div>
          </div>
        </div>
        
        <div class="form-section">
          <div class="form-label">Resources Assigned. List team members that worked onsite with you.</div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">#</th>
                <th style="width: 40%; text-align: center;">Name</th>
                <th style="width: 25%; text-align: center;">Title</th>
                <th style="width: 25%; text-align: center;">Organization</th>
              </tr>
            </thead>
            <tbody>
              ${data.team_members.map((member, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}.</td>
                  <td>${member.name}</td>
                  <td>${member.title}</td>
                  <td>${member.organization}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="form-section">
          <div class="form-label">Activity Log. Complete the table. Example: 5/22/25 - 8:30AM: Met with team to develop action plans/22/25 - 9:00AM: Began unloading trucks w/ team; organizes supplies</div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">#</th>
                <th style="width: 30%; text-align: center;">Date/Time</th>
                <th style="width: 60%; text-align: center;">Noteable Activities</th>
              </tr>
            </thead>
            <tbody>
              ${data.activities.map((activity, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}.</td>
                  <td>${activity.date_time}</td>
                  <td>${activity.notable_activities}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="form-section">
          <div class="checkbox-field">
            <input type="checkbox" ${data.is_complete ? 'checked' : ''} disabled>
            <span class="form-label">I am complete. *</span>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }
}