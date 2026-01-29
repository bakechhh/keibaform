import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  fileName?: string;
  scale?: number;
  backgroundColor?: string;
  padding?: number;
}

// OKLabからRGBに変換
function oklabToRgb(l: number, a: number, b: number, alpha: number = 1): string {
  try {
    const L = l + 0.3963377774 * a + 0.2158037573 * b;
    const M = l - 0.1055613458 * a - 0.0638541728 * b;
    const S = l - 0.0894841775 * a - 1.2914855480 * b;

    const l_ = L * L * L;
    const m_ = M * M * M;
    const s_ = S * S * S;

    let r = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
    let g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
    let bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

    const toSrgb = (x: number) => {
      if (x <= 0.0031308) return 12.92 * x;
      return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    };

    r = Math.round(Math.max(0, Math.min(1, toSrgb(r))) * 255);
    g = Math.round(Math.max(0, Math.min(1, toSrgb(g))) * 255);
    bl = Math.round(Math.max(0, Math.min(1, toSrgb(bl))) * 255);

    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
    }
    return `rgb(${r}, ${g}, ${bl})`;
  } catch {
    return '#808080';
  }
}

function parseOklch(colorString: string): string {
  const match = colorString.match(/oklch\(([^)]+)\)/i);
  if (!match) return colorString;

  try {
    const parts = match[1].split(/[\s/]+/).filter(Boolean);
    let l = parseFloat(parts[0]);
    const c = parseFloat(parts[1]);
    const h = parseFloat(parts[2]);
    let alpha = parts[3] ? parseFloat(parts[3]) : 1;

    if (parts[0].includes('%')) l = l / 100;
    if (parts[3]?.includes('%')) alpha = alpha / 100;

    const a_ = c * Math.cos(h * Math.PI / 180);
    const b_ = c * Math.sin(h * Math.PI / 180);

    return oklabToRgb(l, a_, b_, alpha);
  } catch {
    return '#808080';
  }
}

function parseOklab(colorString: string): string {
  const match = colorString.match(/oklab\(([^)]+)\)/i);
  if (!match) return colorString;

  try {
    const parts = match[1].split(/[\s/]+/).filter(Boolean);
    let l = parseFloat(parts[0]);
    let a = parseFloat(parts[1]);
    let b = parseFloat(parts[2]);
    let alpha = parts[3] ? parseFloat(parts[3]) : 1;

    if (parts[0].includes('%')) l = l / 100;
    if (parts[1].includes('%')) a = a / 100;
    if (parts[2].includes('%')) b = b / 100;
    if (parts[3]?.includes('%')) alpha = alpha / 100;

    return oklabToRgb(l, a, b, alpha);
  } catch {
    return '#808080';
  }
}

function convertModernColors(colorValue: string): string {
  let result = colorValue;
  result = result.replace(/oklch\([^)]+\)/gi, (match) => parseOklch(match));
  result = result.replace(/oklab\([^)]+\)/gi, (match) => parseOklab(match));
  return result;
}

// すべての要素にインラインスタイルで色を強制適用
function forceInlineStyles(element: HTMLElement): void {
  const allElements = element.querySelectorAll('*');
  const elementsToProcess = [element, ...Array.from(allElements)] as HTMLElement[];

  const colorProps = [
    'color', 'background-color', 'border-color',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'outline-color', 'text-decoration-color', 'box-shadow',
    'fill', 'stroke', 'caret-color'
  ];

  elementsToProcess.forEach(el => {
    if (!(el instanceof HTMLElement)) return;

    const computed = window.getComputedStyle(el);

    colorProps.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value && (value.includes('oklch') || value.includes('oklab'))) {
        const converted = convertModernColors(value);
        el.style.setProperty(prop, converted, 'important');
      }
    });

    // background も確認（gradient含む）
    const bg = computed.getPropertyValue('background');
    if (bg && (bg.includes('oklch') || bg.includes('oklab'))) {
      const converted = convertModernColors(bg);
      el.style.setProperty('background', converted, 'important');
    }
  });
}

// スタイルシートにオーバーライドCSSを追加
function addColorOverrideStyles(): HTMLStyleElement {
  const style = document.createElement('style');
  style.id = 'html2canvas-color-override';

  // Tailwind CSS 4.xのデフォルトカラーをrgbでオーバーライド
  style.textContent = `
    * {
      --tw-ring-color: rgb(59, 130, 246) !important;
    }
  `;

  document.head.appendChild(style);
  return style;
}

function removeColorOverrideStyles(style: HTMLStyleElement): void {
  if (style.parentNode) {
    style.parentNode.removeChild(style);
  }
}

export function useImageExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportElement = useCallback(async (
    element: HTMLElement | null,
    options: ExportOptions = {}
  ): Promise<boolean> => {
    if (!element) return false;

    const {
      fileName = `umaai-export-${Date.now()}`,
      scale = 2,
      backgroundColor = '#1a1a2e',
      padding = 20,
    } = options;

    setIsExporting(true);
    const overrideStyle = addColorOverrideStyles();

    try {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        padding: ${padding}px;
        background-color: ${backgroundColor};
        display: inline-block;
        position: absolute;
        left: -9999px;
        top: 0;
      `;

      const clone = element.cloneNode(true) as HTMLElement;
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // インラインスタイルを強制適用
      forceInlineStyles(wrapper);

      const canvas = await html2canvas(wrapper, {
        scale,
        backgroundColor,
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: false,
        onclone: (clonedDoc) => {
          // クローンされたドキュメント内の要素も処理
          const clonedWrapper = clonedDoc.body.querySelector('div');
          if (clonedWrapper) {
            forceInlineStyles(clonedWrapper as HTMLElement);
          }
        }
      });

      document.body.removeChild(wrapper);

      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    } finally {
      removeColorOverrideStyles(overrideStyle);
      setIsExporting(false);
    }
  }, []);

  const exportMultiple = useCallback(async (
    elements: { element: HTMLElement | null; name: string }[],
    options: ExportOptions = {}
  ): Promise<boolean> => {
    const {
      scale = 2,
      backgroundColor = '#1a1a2e',
      padding = 20,
    } = options;

    setIsExporting(true);
    const overrideStyle = addColorOverrideStyles();

    try {
      for (const { element, name } of elements) {
        if (!element) continue;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          padding: ${padding}px;
          background-color: ${backgroundColor};
          display: inline-block;
          position: absolute;
          left: -9999px;
          top: 0;
        `;

        const clone = element.cloneNode(true) as HTMLElement;
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        forceInlineStyles(wrapper);

        const canvas = await html2canvas(wrapper, {
          scale,
          backgroundColor,
          logging: false,
          useCORS: true,
          allowTaint: true,
          onclone: (clonedDoc) => {
            const clonedWrapper = clonedDoc.body.querySelector('div');
            if (clonedWrapper) {
              forceInlineStyles(clonedWrapper as HTMLElement);
            }
          }
        });

        document.body.removeChild(wrapper);

        const link = document.createElement('a');
        link.download = `${name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return true;
    } catch (error) {
      console.error('Batch export failed:', error);
      return false;
    } finally {
      removeColorOverrideStyles(overrideStyle);
      setIsExporting(false);
    }
  }, []);

  const exportFullPage = useCallback(async (
    containerRef: HTMLElement | null,
    options: ExportOptions = {}
  ): Promise<boolean> => {
    if (!containerRef) return false;

    const {
      fileName = `umaai-full-${Date.now()}`,
      scale = 2,
      backgroundColor = '#1a1a2e',
    } = options;

    setIsExporting(true);
    const overrideStyle = addColorOverrideStyles();

    try {
      const clone = containerRef.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      document.body.appendChild(clone);

      forceInlineStyles(clone);

      const canvas = await html2canvas(clone, {
        scale,
        backgroundColor,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: containerRef.scrollWidth,
        windowHeight: containerRef.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.body.firstChild;
          if (clonedElement instanceof HTMLElement) {
            forceInlineStyles(clonedElement);
          }
        }
      });

      document.body.removeChild(clone);

      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      return true;
    } catch (error) {
      console.error('Full page export failed:', error);
      return false;
    } finally {
      removeColorOverrideStyles(overrideStyle);
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    exportElement,
    exportMultiple,
    exportFullPage,
  };
}
