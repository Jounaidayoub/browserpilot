import { Page } from "playwright-crx";

export const MAX_RETURN_CHARS = 20000;

export async function captureDomSnapshot(input: string, activePage: Page) {
  try {
    // return await withActivePage(page, async (activePage) => {
    // Parse options from the input string
    const options = parseSnapshotOptions(input);
    const limit = options.limit
      ? parseInt(options.limit, 10)
      : MAX_RETURN_CHARS;

    let html = "";

    // If a selector is provided, only capture matching elements
    if (options.selector) {
      // Check if the selector exists on the page
      const elementCount = await activePage.$$eval(
        options.selector,
        (els: Element[]) => els.length
      );
      if (elementCount === 0) {
        return `No elements found matching selector: ${options.selector}`;
      }

      html = await activePage.$$eval(
        options.selector,
        (elements: Element[], opts: { structure: boolean; clean: boolean }) => {
          return elements
            .map((el) => {
              if (opts.structure) {
                return getElementStructure(el);
              } else if (opts.clean) {
                return cleanElement(el.cloneNode(true) as Element);
              } else {
                return el.outerHTML;
              }
            })
            .join("\n\n");

          // Helper function to get a clean structure representation
          function getElementStructure(element: Element): string {
            const tagName = element.tagName.toLowerCase();
            const id = element.id ? `#${element.id}` : "";
            const classes =
              element.className && typeof element.className === "string"
                ? `.${element.className.split(" ").join(".")}`
                : "";

            let result = `<${tagName}${id}${classes}>`;

            if (element.children.length > 0) {
              result +=
                "\n  " +
                Array.from(element.children)
                  .map((child) => getElementStructure(child))
                  .join("\n  ")
                  .replace(/\n/g, "\n  ");
            }

            result += `\n</${tagName}>`;
            return result;
          }

          // Helper function to clean an element
          function cleanElement(node: Node): string {
            if (node.nodeType === 3) {
              // Text node
              return node.textContent || "";
            }

            if (node.nodeType !== 1) {
              // Not an element node
              return "";
            }

            const element = node as Element;

            // Skip non-visible elements
            if (
              [
                "SCRIPT",
                "STYLE",
                "NOSCRIPT",
                "TEMPLATE",
                "META",
                "LINK",
              ].includes(element.tagName)
            ) {
              return "";
            }

            // Create a new clean element
            const clean = document.createElement(element.tagName);

            // Copy attributes
            Array.from(element.attributes).forEach((attr: Attr) => {
              // Skip event handlers and data attributes
              if (
                !attr.name.startsWith("on") &&
                !attr.name.startsWith("data-")
              ) {
                clean.setAttribute(attr.name, attr.value);
              }
            });

            // Process children
            Array.from(node.childNodes)
              .map((child) => cleanElement(child))
              .filter(Boolean)
              .forEach((childHtml) => {
                if (typeof childHtml === "string") {
                  clean.innerHTML += childHtml;
                }
              });

            return clean.outerHTML;
          }
        },
        {
          structure: options.structure || false,
          clean: options.clean || false,
        }
      );
    } else {
      // Capture the entire page
      if (options.structure) {
        html = await activePage.evaluate(() => {
          function getPageStructure(element: Element, depth = 0): string {
            const tagName = element.tagName.toLowerCase();
            const id = element.id ? `#${element.id}` : "";
            const classes =
              element.className && typeof element.className === "string"
                ? `.${element.className.split(" ").join(".")}`
                : "";

            let result = "  ".repeat(depth) + `<${tagName}${id}${classes}>`;

            if (element.children.length > 0) {
              result +=
                "\n" +
                Array.from(element.children)
                  .map((child) => getPageStructure(child, depth + 1))
                  .join("\n");
            }

            result += "\n" + "  ".repeat(depth) + `</${tagName}>`;
            return result;
          }

          return getPageStructure(document.documentElement);
        });
      } else if (options.clean) {
        html = await activePage.evaluate(() => {
          function cleanNode(node: Node): string {
            if (node.nodeType === 3) {
              // Text node
              return node.textContent || "";
            }

            if (node.nodeType !== 1) {
              // Not an element node
              return "";
            }

            const element = node as Element;

            // Skip non-visible elements
            if (
              [
                "SCRIPT",
                "STYLE",
                "NOSCRIPT",
                "TEMPLATE",
                "META",
                "LINK",
              ].includes(element.tagName)
            ) {
              return "";
            }

            // Create a new clean element
            const clean = document.createElement(element.tagName);

            // Copy attributes
            Array.from(element.attributes).forEach((attr: Attr) => {
              // Skip event handlers and data attributes
              if (
                !attr.name.startsWith("on") &&
                !attr.name.startsWith("data-")
              ) {
                clean.setAttribute(attr.name, attr.value);
              }
            });

            // Process children
            Array.from(node.childNodes)
              .map((child) => cleanNode(child))
              .filter(Boolean)
              .forEach((childHtml) => {
                if (typeof childHtml === "string") {
                  clean.innerHTML += childHtml;
                }
              });

            return clean.outerHTML;
          }

          return cleanNode(document.documentElement);
        });
      } else {
        // Get the raw HTML content
        html = await activePage.content();
      }
    }

    return truncate(html, isNaN(limit) ? MAX_RETURN_CHARS : limit);
    // });
  } catch (err) {
    return `Error capturing DOM snapshot: ${
      err instanceof Error ? err.message : String(err)
    }`;
  }
}
//   });

export function truncate(
  str: string,
  maxLength: number = MAX_RETURN_CHARS
): string {
  if (str.length <= maxLength) return str;
  return (
    str.substring(0, maxLength) +
    `\n\n[Truncated ${str.length - maxLength} characters]`
  );
}

function parseSnapshotOptions(input: string) {
  const options: {
    selector?: string;
    clean?: boolean;
    structure?: boolean;
    limit?: string;
  } = {};

  if (!input || input.trim() === "") {
    return options;
  }

  // Check if input is just a number (backward compatibility)
  if (/^\d+$/.test(input.trim())) {
    options.limit = input.trim();
    return options;
  }

  // Parse comma-separated options
  input.split(",").forEach((part) => {
    const trimmed = part.trim();

    if (trimmed === "clean") {
      options.clean = true;
    } else if (trimmed === "structure") {
      options.structure = true;
    } else if (trimmed.startsWith("selector=")) {
      options.selector = trimmed.substring("selector=".length);
    } else if (trimmed.startsWith("limit=")) {
      options.limit = trimmed.substring("limit=".length);
    }
  });

  return options;
}
