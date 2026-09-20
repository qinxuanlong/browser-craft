/**
 * 获取输入框或 contenteditable 中当前光标的屏幕像素绝对坐标 (x, y)
 * 用于将斜杠补全弹窗精准锚定在光标正下方
 */

export interface CaretCoordinates {
  top: number;
  left: number;
  height: number;
}

/**
 * 针对 contenteditable 获取光标坐标
 */
function getContentEditableCoordinates(): CaretCoordinates | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(true);

  let rect = range.getBoundingClientRect();

  // 若处于空行，rect 宽高可能为 0，尝试临时插入不可见占位字符测量
  if (rect.width === 0 && rect.height === 0) {
    const span = document.createElement("span");
    span.appendChild(document.createTextNode("\u200b"));
    range.insertNode(span);
    rect = span.getBoundingClientRect();
    const parent = span.parentNode;
    if (parent) {
      parent.removeChild(span);
      parent.normalize();
    }
  }

  return {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    height: rect.height || 18,
  };
}

/**
 * 针对 textarea / input，使用镜像 Div 测算光标坐标
 */
function getInputElementCoordinates(
  element: HTMLTextAreaElement | HTMLInputElement
): CaretCoordinates {
  const rect = element.getBoundingClientRect();

  // 兜底定位到输入框左上偏内一点
  const fallback: CaretCoordinates = {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX + 16,
    height: 20,
  };

  try {
    const position = element.selectionEnd || 0;
    const style = window.getComputedStyle(element);

    const mirror = document.createElement("div");
    mirror.id = "promptcraft-caret-mirror";

    const propertiesToCopy = [
      "direction",
      "boxSizing",
      "width",
      "height",
      "overflowX",
      "overflowY",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
      "borderStyle",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "fontStyle",
      "fontVariant",
      "fontWeight",
      "fontStretch",
      "fontSize",
      "fontSizeAdjust",
      "lineHeight",
      "fontFamily",
      "textAlign",
      "textTransform",
      "textIndent",
      "textDecoration",
      "letterSpacing",
      "wordSpacing",
      "tabSize",
      "MozTabSize",
    ];

    propertiesToCopy.forEach((prop) => {
      // @ts-expect-error computed style index
      mirror.style[prop] = style[prop];
    });

    mirror.style.position = "absolute";
    mirror.style.top = `${rect.top + window.scrollY}px`;
    mirror.style.left = `${rect.left + window.scrollX}px`;
    mirror.style.visibility = "hidden";
    mirror.style.pointerEvents = "none";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordWrap = "break-word";

    const textBefore = element.value.substring(0, position);
    mirror.textContent = textBefore;

    const span = document.createElement("span");
    span.textContent = element.value.substring(position) || ".";
    mirror.appendChild(span);

    document.body.appendChild(mirror);

    const spanRect = span.getBoundingClientRect();
    const result: CaretCoordinates = {
      top: spanRect.top + window.scrollY + 20,
      left: spanRect.left + window.scrollX,
      height: 20,
    };

    document.body.removeChild(mirror);
    return result;
  } catch {
    return fallback;
  }
}

/**
 * 获取任意输入框的当前光标绝对坐标
 */
export function getCaretCoordinates(element: HTMLElement): CaretCoordinates {
  if (element.isContentEditable || element.getAttribute("contenteditable") === "true") {
    const coords = getContentEditableCoordinates();
    if (coords) return coords;
  }

  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    return getInputElementCoordinates(element);
  }

  const rect = element.getBoundingClientRect();
  return {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    height: 20,
  };
}
