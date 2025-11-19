import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface SheetRow {
  keyword: string;
  referenceUrl?: string;
  status: 'Not Started' | 'Pending' | 'Finished' | 'Error';
  youtubeUrl?: string;
  rowIndex: number;
}

export class GoogleSheetsService {
  private sheets;
  private auth: OAuth2Client;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  setCredentials(tokens: any) {
    this.auth.setCredentials(tokens);
  }

  getAuthUrl(): string {
    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  async getTokenFromCode(code: string) {
    const { tokens } = await this.auth.getToken(code);
    this.setCredentials(tokens);
    return tokens;
  }

  async readPendingKeywords(spreadsheetId: string): Promise<SheetRow[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A:D', // Read columns A through D
      });

      const rows = response.data.values || [];
      const pendingRows: SheetRow[] = [];

      // Skip header row (index 0)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const keyword = row[0]?.trim();
        const referenceUrl = row[1]?.trim();
        const status = row[2]?.trim() || 'Not Started';
        const youtubeUrl = row[3]?.trim();

        // Only include rows where keyword exists and status is "Not Started"
        if (keyword && status === 'Not Started') {
          pendingRows.push({
            keyword,
            referenceUrl: referenceUrl || undefined,
            status: 'Not Started',
            youtubeUrl: youtubeUrl || undefined,
            rowIndex: i + 1, // +1 for 1-based indexing
          });
        }
      }

      return pendingRows;
    } catch (error: any) {
      console.error('Failed to read sheet:', error);
      throw new Error(`Failed to read Google Sheet: ${error.message}`);
    }
  }

  async updateRowStatus(
    spreadsheetId: string,
    rowIndex: number,
    status: 'Pending' | 'Finished' | 'Error',
    youtubeUrl?: string
  ): Promise<void> {
    try {
      const updates: any[] = [];

      // Update column C (status)
      updates.push({
        range: `C${rowIndex}`,
        values: [[status]],
      });

      // Update column D (YouTube URL) if provided
      if (youtubeUrl) {
        updates.push({
          range: `D${rowIndex}`,
          values: [[youtubeUrl]],
        });
      }

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updates,
        },
      });
    } catch (error: any) {
      console.error('Failed to update sheet:', error);
      throw new Error(`Failed to update Google Sheet: ${error.message}`);
    }
  }

  async appendLog(spreadsheetId: string, logData: string[]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Log!A:Z', // Assumes a "Log" sheet exists
        valueInputOption: 'RAW',
        requestBody: {
          values: [logData],
        },
      });
    } catch (error: any) {
      console.error('Failed to append log:', error);
      // Don't throw - logging failure shouldn't break the process
    }
  }

  async getSpreadsheetMetadata(spreadsheetId: string): Promise<{ title: string; sheetCount: number }> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'properties.title,sheets.properties.title',
      });

      return {
        title: response.data.properties?.title || 'Unknown',
        sheetCount: response.data.sheets?.length || 0,
      };
    } catch (error: any) {
      console.error('Failed to get spreadsheet metadata:', error);
      throw new Error(`Failed to access Google Sheet: ${error.message}`);
    }
  }
}
