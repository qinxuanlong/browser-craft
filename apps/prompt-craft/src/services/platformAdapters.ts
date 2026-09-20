/**
 * 针对各主流 AI 网页聊天输入框及全网通用输入框的注入适配器
 */

/**
 * 模拟原生 React / Vue 控制组件的值更新并分发合成事件
 */
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
}

/**
 * 向输入框中安全插入文本，并尽可能替换光标前的触发字符（如 "/"）
 */
export async function injectTextIntoElement(
  element: HTMLElement,
  textToInsert: string,
  prefixToRemove: string = "/"
): Promise<boolean> {
  try {
    element.focus();

    // 1. 标准文本域或输入框 (Textarea / Input)
    if (
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLInputElement
    ) {
      const currentVal = element.value;
      const start = element.selectionStart ?? currentVal.length;
      const end = element.selectionEnd ?? currentVal.length;

      // 检查光标前是否有触发前缀（如 "/" 或 "、"），有则将其替换掉
      let replaceStart = start;
      if (prefixToRemove && start > 0) {
        const textBefore = currentVal.substring(0, start);
        if (textBefore.endsWith(prefixToRemove)) {
          replaceStart = start - prefixToRemove.length;
        } else if (textBefore.endsWith("/") || textBefore.endsWith("、")) {
          replaceStart = start - 1;
        }
      }

      const newVal =
        currentVal.substring(0, replaceStart) +
        textToInsert +
        currentVal.substring(end);

      setNativeValue(element, newVal);

      // 分发合成事件告知 React/Vue 内部状态更新
      element.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: textToInsert,
        })
      );
      element.dispatchEvent(new Event("change", { bubbles: true }));

      // 光标后移到插入文本末尾
      const newCursorPos = replaceStart + textToInsert.length;
      element.setSelectionRange(newCursorPos, newCursorPos);

      // 触发一次键盘按键与滚屏事件调整高度
      element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
      return true;
    }

    // 2. 现代富文本与 AI 编辑器 (ContentEditable: ProseMirror, Lexical 等)
    if (element.isContentEditable || element.getAttribute("contenteditable") === "true") {
      const selection = window.getSelection();

      // 若有选区且光标前有触发符，尝试选中触发符后再覆盖
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // 如果光标在文本节点内且紧贴触发符，回退一个字符范围
        if (prefixToRemove && range.collapsed && range.startContainer.nodeType === Node.TEXT_NODE) {
          const textNode = range.startContainer as Text;
          const textContent = textNode.textContent || "";
          const offset = range.startOffset;

          if (offset >= prefixToRemove.length) {
            const potentialPrefix = textContent.substring(offset - prefixToRemove.length, offset);
            if (potentialPrefix === prefixToRemove) {
              range.setStart(textNode, offset - prefixToRemove.length);
              range.deleteContents();
            }
          }
        }
      }

      // 使用现代浏览器原生的 insertText 命令（它能完美穿透 Lexical 与 ProseMirror 内部状态）
      const success = document.execCommand("insertText", false, textToInsert);
      if (success) {
        element.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }

      // 若 execCommand 受限，则降级使用 InputEvent 合成注入
      const inputEvent = new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: textToInsert,
      });
      element.dispatchEvent(inputEvent);

      // 兜底追加文本节点
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(textToInsert);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      element.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    return false;
  } catch (error) {
    console.error("PromptCraft 文本注入失败:", error);
    return false;
  }
}

/**
 * 探测当前页面最有可能处于激活状态的输入框元素
 */
export function detectActiveInputElement(): HTMLElement | null {
  const active = document.activeElement;
  if (
    active &&
    (active instanceof HTMLTextAreaElement ||
      active instanceof HTMLInputElement ||
      active.getAttribute("contenteditable") === "true")
  ) {
    return active as HTMLElement;
  }

  // 深度扫描各大 AI 平台的专用容器选择器
  const aiSelectors = [
    // DeepSeek
    "textarea#chat-input",
    "textarea[placeholder*='DeepSeek']",
    "textarea[placeholder*='输入']",
    // ChatGPT
    "#prompt-textarea",
    "div[contenteditable='true']#prompt-textarea",
    // Claude
    "div.ProseMirror[contenteditable='true']",
    "div[contenteditable='true'][enterkeyhint='send']",
    // Kimi
    "div[contenteditable='true']",
    // 豆包
    "textarea[data-testid='chat_input_textarea']",
    // 通用最后兜底
    "textarea",
  ];

  for (const selector of aiSelectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && el.offsetParent !== null) {
      return el;
    }
  }

  return null;
}
