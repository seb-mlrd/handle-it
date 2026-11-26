import { expect, type Page } from '@playwright/test';

export interface AuditProblem {
  readonly rule: string;
  readonly detail: string;
}

/** Contrôles d'accessibilité et d'affichage faits dans la page, sans bibliothèque externe. */
export async function auditPage(page: Page): Promise<AuditProblem[]> {
  const unnamed = await findUnnamedControls(page);
  const inPage = await page.evaluate(() => {
    const problems: { rule: string; detail: string }[] = [];
    const describe = (element: Element) =>
      `${element.tagName.toLowerCase()} « ${(element.textContent ?? '').trim().slice(0, 40)} »`;

    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      problems.push({ rule: 'débordement', detail: `${document.documentElement.scrollWidth}px` });
    }
    if (!document.documentElement.lang) problems.push({ rule: 'langue', detail: 'html sans lang' });

    const isVisible = (element: Element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0;
    };
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(isVisible);
    // Une maquette (role="img") et un décor ne comptent pas : les lecteurs d'écran les sautent.
    const pageHeadings = headings.filter(
      (heading) => !heading.closest('dialog, [role="img"], [aria-hidden="true"]'),
    );
    if (pageHeadings.filter((heading) => heading.tagName === 'H1').length !== 1) {
      problems.push({ rule: 'titre h1', detail: 'un seul h1 attendu hors fenêtre' });
    }
    let previousLevel = 0;
    for (const heading of pageHeadings) {
      const level = Number(heading.tagName[1]);
      if (level > previousLevel + 1) problems.push({ rule: 'titres', detail: describe(heading) });
      previousLevel = level;
    }
    for (const image of document.querySelectorAll('img:not([alt])')) {
      problems.push({ rule: 'alt', detail: describe(image) });
    }

    // Le navigateur convertit lui-même tout format (oklab, color-mix…) en pixels RVB.
    const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const parseColour = (value: string) => {
      if (!context) return { rgb: [0, 0, 0], alpha: 1 };
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [red = 0, green = 0, blue = 0, alpha = 0] = context.getImageData(0, 0, 1, 1).data;
      return { rgb: [red, green, blue], alpha: alpha / 255 };
    };
    const luminance = ([red = 0, green = 0, blue = 0]: number[]) => {
      const linear = (channel: number) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
    };
    const findBackground = (element: Element | null): number[] => {
      for (let current = element; current; current = current.parentElement) {
        const { rgb, alpha } = parseColour(getComputedStyle(current).backgroundColor);
        if (alpha > 0.5) return rgb;
      }
      return parseColour(getComputedStyle(document.body).backgroundColor).rgb;
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const checked = new Set<Element>();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      if (!element || checked.has(element) || !node.textContent?.trim()) continue;
      checked.add(element);
      if (!isVisible(element) || element.closest('[aria-hidden="true"], :disabled')) continue;
      const style = getComputedStyle(element);
      if (Number(style.opacity) < 1) continue;
      const lighter = Math.max(
        luminance(parseColour(style.color).rgb),
        luminance(findBackground(element)),
      );
      const darker = Math.min(
        luminance(parseColour(style.color).rgb),
        luminance(findBackground(element)),
      );
      const ratio = (lighter + 0.05) / (darker + 0.05);
      const size = Number.parseFloat(style.fontSize);
      const isLarge = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      if (ratio < (isLarge ? 3 : 4.5)) {
        problems.push({ rule: 'contraste', detail: `${describe(element)} ${ratio.toFixed(2)}` });
      }
    }
    return problems;
  });
  return [...unnamed, ...inPage];
}

/** Un contrôle sans nom apparaît sans texte dans l'arbre d'accessibilité. */
async function findUnnamedControls(page: Page): Promise<AuditProblem[]> {
  const tree = await page.locator('body').ariaSnapshot();
  const pattern = /^\s*- (button|link|textbox|combobox|checkbox)(?: \[[^\]]*\])*:?$/gm;
  return [...tree.matchAll(pattern)].map((match) => ({ rule: 'nom', detail: match[0].trim() }));
}

export async function expectCleanPage(page: Page, label: string): Promise<void> {
  await expect.poll(() => auditPage(page), { message: label }).toEqual([]);
}
