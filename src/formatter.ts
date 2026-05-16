/**
 * Character-by-character JSON formatter.
 * Works even on invalid JSON — used for best-effort pretty-printing.
 */
export function formatJson(json: string, indent: string = "  "): string {
  let result = "";
  let depth = 0;
  let inString = false;
  let escaped = false;
  let i = 0;

  const newline = (): string => {
    return "\n" + indent.repeat(depth);
  };

  while (i < json.length) {
    const ch = json[i];

    if (escaped) {
      result += ch;
      escaped = false;
      i++;
      continue;
    }

    if (ch === "\\" && inString) {
      result += ch;
      escaped = true;
      i++;
      continue;
    }

    if (ch === '"' && !escaped) {
      inString = !inString;
      result += ch;
      i++;
      continue;
    }

    if (inString) {
      result += ch;
      i++;
      continue;
    }

    // Outside string
    switch (ch) {
      case "{":
      case "[":
        result += ch;
        depth++;
        // Check if the next non-whitespace is the closing bracket
        if (!isEmptyBracket(json, i)) {
          result += newline();
        }
        break;
      case "}":
      case "]":
        depth = Math.max(0, depth - 1);
        if (!isPrecededByOpen(result, ch)) {
          result += newline();
        }
        result += ch;
        break;
      case ",":
        result += ch;
        result += newline();
        break;
      case ":":
        result += ": ";
        break;
      case " ":
      case "\t":
      case "\n":
      case "\r":
        // Skip existing whitespace
        break;
      default:
        result += ch;
        break;
    }
    i++;
  }

  return result;
}

function isEmptyBracket(json: string, openPos: number): boolean {
  const openChar = json[openPos];
  const closeChar = openChar === "{" ? "}" : "]";
  let j = openPos + 1;
  while (j < json.length) {
    const ch = json[j];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      j++;
      continue;
    }
    return ch === closeChar;
  }
  return false;
}

function isPrecededByOpen(result: string, closeChar: string): boolean {
  const openChar = closeChar === "}" ? "{" : "[";
  // Walk backwards past whitespace
  for (let i = result.length - 1; i >= 0; i--) {
    const ch = result[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      continue;
    }
    return ch === openChar;
  }
  return false;
}
