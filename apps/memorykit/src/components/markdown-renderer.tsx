"use client";

import { Card, CardContent } from "@ndos/ui";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const renderMarkdown = (text: string): string => {
    const lines = text.split("\n");
    const html: string[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          html.push(
            `<pre class="my-3 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm text-foreground"><code>${codeContent.join("\n")}</code></pre>`
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          if (inList) {
            html.push("</ul>");
            inList = false;
          }
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(escapeHtml(line));
        continue;
      }

      // Horizontal rule
      if (/^-{3,}$/.test(line.trim())) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        html.push('<hr class="my-4 border-border" />');
        continue;
      }

      // Headings
      if (line.startsWith("### ")) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        html.push(
          `<h3 class="mt-5 mb-2 text-base font-semibold text-foreground">${formatInline(line.slice(4))}</h3>`
        );
        continue;
      }

      if (line.startsWith("## ")) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        html.push(
          `<h2 class="mt-6 mb-3 text-lg font-bold text-foreground">${formatInline(line.slice(3))}</h2>`
        );
        continue;
      }

      if (line.startsWith("# ")) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        html.push(
          `<h1 class="mt-6 mb-3 text-xl font-bold text-foreground">${formatInline(line.slice(2))}</h1>`
        );
        continue;
      }

      // List items
      if (/^[-*]\s/.test(line.trim())) {
        if (!inList) {
          html.push('<ul class="my-2 space-y-1 pl-4">');
          inList = true;
        }
        html.push(
          `<li class="text-sm text-foreground before:mr-2 before:text-muted-foreground before:content-['•']">${formatInline(line.trim().slice(2))}</li>`
        );
        continue;
      }

      // Close list if we hit a non-list line
      if (inList && line.trim() !== "") {
        html.push("</ul>");
        inList = false;
      }

      // Empty line
      if (line.trim() === "") {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        continue;
      }

      // Paragraph
      html.push(
        `<p class="mb-2 text-sm leading-relaxed text-foreground">${formatInline(line)}</p>`
      );
    }

    if (inList) html.push("</ul>");
    if (inCodeBlock) {
      html.push(
        `<pre class="my-3 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm text-foreground"><code>${codeContent.join("\n")}</code></pre>`
      );
    }

    return html.join("\n");
  };

  const escapeHtml = (str: string): string =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const formatInline = (text: string): string => {
    let result = escapeHtml(text);
    // Bold
    result = result.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-foreground">$1</strong>'
    );
    // Inline code
    result = result.replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">$1</code>'
    );
    return result;
  };

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
