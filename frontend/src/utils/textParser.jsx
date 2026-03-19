/**
 * Parse markdown-style text and convert to React elements
 * Handles **bold** text and other formatting
 */
export function parseTextToElements(text) {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // Add the bold part
    parts.push({
      type: 'bold',
      content: match[1],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

/**
 * Render parsed text parts as JSX with proper React elements
 */
export function renderParsedText(text) {
  const parts = parseTextToElements(text);

  return parts.map((part, index) => {
    if (part.type === 'bold') {
      return <strong key={index}>{part.content}</strong>;
    }
    return <span key={index}>{part.content}</span>;
  });
}

/**
 * Split text by lines and render each line with formatting
 */
export function renderFormattedLines(text) {
  if (!text) return null;

  return text.split('\n').map((line, index) => {
    if (!line.trim()) return null;

    // Handle headers (###)
    if (line.startsWith('###')) {
      return (
        <div key={index} style={{ fontWeight: 'bold', marginBottom: '8px', marginTop: '8px', fontSize: '1.1em' }}>
          {renderParsedText(line.replace(/^###\s*/, ''))}
        </div>
      );
    }

    // Handle bullet points
    if (line.startsWith('•')) {
      return (
        <div key={index} style={{ marginLeft: '16px', marginBottom: '4px' }}>
          {renderParsedText(line)}
        </div>
      );
    }

    // Regular text with formatting
    return (
      <div key={index} style={{ marginBottom: '4px' }}>
        {renderParsedText(line)}
      </div>
    );
  });
}
