/**
 * HTML Text Extractor
 *
 * Extracts readable text from HTML pages, stripping JS/CSS/markup
 * while preserving semantic structure (headings, tables, lists).
 *
 * No external dependencies — uses regex-based extraction.
 * Not a full DOM parser, but handles well-structured wiki HTML.
 */

/**
 * Extract clean text content from an HTML string.
 * 
 * @param {string} html - Raw HTML content
 * @returns {string} - Cleaned text with lightweight formatting
 */
export function extractTextFromHtml(html) {
    let text = html;

    // Remove everything we don't want
    text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
    text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '');
    text = text.replace(/<!--[\s\S]*?-->/g, '');

    // Convert semantic elements to text markers
    text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
    text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
    text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
    text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');

    // Lists
    text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '  • $1\n');
    text = text.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');

    // Table handling — convert rows to pipe format
    text = text.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (match, content) => {
        const cells = [];
        content.replace(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi, (_, cell) => {
            cells.push(cell.replace(/<[^>]+>/g, '').trim());
        });
        return cells.length ? '| ' + cells.join(' | ') + ' |\n' : '';
    });
    text = text.replace(/<\/?(table|thead|tbody|tfoot)[^>]*>/gi, '\n');

    // Paragraphs and line breaks
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<p[^>]*>/gi, '');

    // Code blocks
    text = text.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n');
    text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

    // Bold/italic
    text = text.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
    text = text.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');

    // Links — keep text, drop href
    text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');

    // Strip all remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode common HTML entities
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&nbsp;/g, ' ');

    // Clean up whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.split('\n').map(line => line.trim()).join('\n');
    text = text.trim();

    return text;
}

/**
 * Extract text from an HTML file on disk.
 * 
 * @param {string} filePath - Path to HTML file
 * @param {object} fsModule - fs module (passed in to avoid top-level await)
 * @returns {string} - Extracted text
 */
export function extractTextFromHtmlFile(filePath, fsModule) {
    const html = fsModule.readFileSync(filePath, 'utf8');
    return extractTextFromHtml(html);
}
