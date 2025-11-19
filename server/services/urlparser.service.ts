import axios from 'axios';
import * as cheerio from 'cheerio';

export class URLParserService {
  async extractContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      // Remove script, style, and other non-content tags
      $('script, style, nav, footer, header').remove();

      // Try to extract main content
      let content = '';

      // Common content selectors
      const selectors = [
        'article',
        'main',
        '.content',
        '.post-content',
        '.entry-content',
        '#content',
        '.article-body',
      ];

      for (const selector of selectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text();
          break;
        }
      }

      // Fallback to body if no specific content found
      if (!content) {
        content = $('body').text();
      }

      // Clean up the content
      content = content
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
        .trim();

      // Limit to first 2000 characters for context
      if (content.length > 2000) {
        content = content.substring(0, 2000) + '...';
      }

      return content;
    } catch (error: any) {
      console.error(`Failed to extract content from ${url}:`, error.message);
      return ''; // Return empty string on failure
    }
  }

  async getTitle(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
      
      return title.trim();
    } catch (error: any) {
      console.error(`Failed to get title from ${url}:`, error.message);
      return '';
    }
  }
}
