import React, { useEffect, useState, useCallback, useRef } from "react";
import { Skill } from "../types";
import { getAllSkills } from "../services/storage";
import {
  injectTextIntoElement,
  composePromptWithSkills,
  getInputValue,
  setInputValue,
  findSendButton,
} from "../services/platformAdapters";
import { getCaretCoordinates } from "../utils/caretCoordinates";
import { SlashMenu } from "./SlashMenu";
import { QuickPalette } from "./QuickPalette";
import { FloatingButton } from "./FloatingButton";
import { SkillTagBar } from "./SkillTagBar";

export const PromptCraftRoot: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  // 1. 激活的技能指令胶囊标签列表
  const [activeTags, setActiveTags] = useState<Skill[]>([]);
  const activeTagsRef = useRef<Skill[]>([]);
  activeTagsRef.current = activeTags;

  // 2. 斜杠就地补全状态
  const [isSlashOpen, setIsSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPrefix, setSlashPrefix] = useState("/");
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const [activeInputRect, setActiveInputRect] = useState<DOMRect | null>(null);

  // 3. 全局调色板状态 (Alt+P)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // 4. 输入框悬浮轻量胶囊按钮位置
  const [capsulePos, setCapsulePos] = useState<{ top: number; left: number } | null>(null);

  // 5. 提交防抖与拦截标志
  const isSubmittingRef = useRef(false);
  const activeElementRef = useRef<HTMLElement | null>(null);

  // 加载技能数据与配置
  const refreshSkills = useCallback(async () => {
    const list = await getAllSkills();
    setSkills(list);
  }, []);

  useEffect(() => {
    void refreshSkills();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.promptcraft_skills) {
        setSkills(changes.promptcraft_skills.newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [refreshSkills]);

  // 更新目标输入框的最新矩形坐标
  const updateInputRect = useCallback((el: HTMLElement | null) => {
    if (!el || !document.contains(el)) {
      setCapsulePos(null);
      setActiveInputRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setCapsulePos(null);
      setActiveInputRect(null);
      return;
    }

    setActiveInputRect(rect);
    setCapsulePos({
      top: rect.top - 28,
      left: Math.max(10, rect.right - 70),
    });
  }, []);

  // 移除指定技能胶囊
  const handleRemoveTag = (skillId: string) => {
    setActiveTags((prev) => {
      const updated = prev.filter((s) => s.id !== skillId);
      activeTagsRef.current = updated;
      return updated;
    });

    const target = activeElementRef.current || targetElement;
    if (target) {
      target.focus();
    }
  };

  // 技能选中处理：转换为指令胶囊，清空斜杠字符，光标保持在输入框
  const handleSelectSkill = async (skill: Skill, prefixToRemove = "/") => {
    const target = activeElementRef.current || targetElement;
    if (target && prefixToRemove) {
      // 从输入框中抹除刚刚输入的触发符（如 "/" 或 "/query"）
      await injectTextIntoElement(target, "", prefixToRemove);
      target.focus();
    }

    // 将选中的技能追加到激活胶囊列表中
    setActiveTags((prev) => {
      if (prev.some((s) => s.id === skill.id)) return prev;
      const updated = [...prev, skill];
      activeTagsRef.current = updated;
      return updated;
    });

    // 关闭斜杠菜单与调色板
    setIsSlashOpen(false);
    setIsPaletteOpen(false);

    if (target) {
      target.focus();
      updateInputRect(target);
    }
  };

  // 拦截并执行智能合成提交
  const executeInterceptedSubmit = async (target: HTMLElement) => {
    if (isSubmittingRef.current || activeTagsRef.current.length === 0) return;

    isSubmittingRef.current = true;
    try {
      // 1. 获取用户在输入框中填写的具体任务内容
      const currentInput = getInputValue(target);

      // 2. 智能合成技能系统指令与用户输入
      const composedText = composePromptWithSkills(activeTagsRef.current, currentInput);

      // 3. 立即清理激活胶囊徽章，恢复干净状态
      setActiveTags([]);
      activeTagsRef.current = [];

      // 4. 将合成好的完整指令注入输入框并更新组件状态
      setInputValue(target, composedText);

      // 5. 毫秒级微等待，让宿主框架 (React/Vue/Preact) 完成数据同步
      await new Promise((resolve) => setTimeout(resolve, 80));

      // 6. 优先触发目标平台的发送按钮
      const sendBtn = findSendButton(target);
      if (sendBtn) {
        sendBtn.click();
      } else {
        // 兜底：向输入框派发原生 Enter 提交事件
        target.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          })
        );
      }
    } catch (err) {
      console.error("PromptCraft 提交指令失败:", err);
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 350);
    }
  };

  // 全局事件侦听与输入捕获
  useEffect(() => {
    // 1. 焦点变化侦听
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target instanceof HTMLTextAreaElement ||
          target instanceof HTMLInputElement ||
          target.isContentEditable ||
          target.getAttribute("contenteditable") === "true")
      ) {
        activeElementRef.current = target;
        setTargetElement(target);
        updateInputRect(target);
      }
    };

    // 2. 滚动与尺寸变化追踪
    const handleViewportChange = () => {
      const target = activeElementRef.current || targetElement;
      if (target) {
        updateInputRect(target);
      }
    };

    // 3. 输入侦听：斜杠指令触发与光标追踪
    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      activeElementRef.current = target;
      setTargetElement(target);
      updateInputRect(target);

      // 获取当前文本及光标位置
      let textBeforeCursor = "";
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement
      ) {
        const pos = target.selectionStart ?? target.value.length;
        textBeforeCursor = target.value.substring(0, pos);
      } else if (target.isContentEditable) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          if (range.startContainer.nodeType === Node.TEXT_NODE) {
            textBeforeCursor = (range.startContainer.textContent || "").substring(0, range.startOffset);
          }
        }
      }

      // 同时支持英文斜杠 "/" 与中文顿号 "、"
      const slashIndex = textBeforeCursor.lastIndexOf("/");
      const dunhaoIndex = textBeforeCursor.lastIndexOf("、");
      const triggerIndex = Math.max(slashIndex, dunhaoIndex);

      if (triggerIndex !== -1) {
        const triggerChar = textBeforeCursor[triggerIndex];
        const charBefore = triggerIndex > 0 ? textBeforeCursor[triggerIndex - 1] : " ";

        // 确保触发符位于行首、空格或换行后，避免误判 URL 中的斜杠如 http://
        if (/\s/.test(charBefore) || triggerIndex === 0) {
          const query = textBeforeCursor.substring(triggerIndex + 1);
          // 若查询词未包含换行或空格，且长度适中，则唤起联想
          if (!query.includes(" ") && !query.includes("\n") && query.length <= 15) {
            const rect = target.getBoundingClientRect();
            setActiveInputRect(rect);

            const coords = getCaretCoordinates(target);
            setSlashPos({ top: coords.top, left: coords.left });
            setSlashQuery(query);
            setSlashPrefix(`${triggerChar}${query}`);
            setIsSlashOpen(true);
            return;
          }
        }
      }

      setIsSlashOpen(false);
    };

    // 4. 键盘按键侦听（Alt+P、Backspace 删胶囊、Enter 拦截合成发送）
    const handleKeyDown = (e: KeyboardEvent) => {
      // 快捷键 Alt+P 打开全局技能调色板
      if (e.altKey && (e.key === "p" || e.key === "P" || e.code === "KeyP")) {
        e.preventDefault();
        e.stopPropagation();
        setIsPaletteOpen((prev) => !prev);
        return;
      }

      const target = activeElementRef.current || targetElement;
      if (!target) return;

      // 退格键删除胶囊：当输入框文本为空时按 Backspace，移除最近挂载的一个技能胶囊
      if (e.key === "Backspace" && activeTagsRef.current.length > 0) {
        const currentText = getInputValue(target);
        if (!currentText || currentText.trim() === "") {
          e.preventDefault();
          setActiveTags((prev) => {
            const updated = prev.slice(0, -1);
            activeTagsRef.current = updated;
            return updated;
          });
          return;
        }
      }

      // 回车发送拦截：挂载了技能胶囊时，拦截普通回车，执行智能合成并发送
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.isComposing &&
        !isSubmittingRef.current &&
        activeTagsRef.current.length > 0
      ) {
        e.preventDefault();
        e.stopPropagation();
        void executeInterceptedSubmit(target);
      }
    };

    // 5. 点击发送按钮拦截
    const handleClick = (e: MouseEvent) => {
      if (isSubmittingRef.current || activeTagsRef.current.length === 0) return;

      const target = activeElementRef.current || targetElement;
      if (!target) return;

      const clickedEl = e.target as HTMLElement;
      if (!clickedEl) return;

      const sendBtn = findSendButton(target);
      if (sendBtn && (sendBtn === clickedEl || sendBtn.contains(clickedEl))) {
        e.preventDefault();
        e.stopPropagation();
        void executeInterceptedSubmit(target);
      }
    };

    window.addEventListener("focusin", handleFocusIn, true);
    window.addEventListener("input", handleInput, true);
    window.addEventListener("compositionend", handleInput, true);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("click", handleClick, true);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange, true);

    return () => {
      window.removeEventListener("focusin", handleFocusIn, true);
      window.removeEventListener("input", handleInput, true);
      window.removeEventListener("compositionend", handleInput, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange, true);
    };
  }, [targetElement, updateInputRect]);

  return (
    <>
      {/* 1. 技能指令胶囊栏 (Command Pill Tag Bar) */}
      <SkillTagBar
        skills={activeTags}
        onRemove={handleRemoveTag}
        targetRect={activeInputRect}
      />

      {/* 2. 斜杠就地联想补全气泡 */}
      {isSlashOpen && (
        <SlashMenu
          skills={skills}
          query={slashQuery}
          position={slashPos}
          inputRect={activeInputRect}
          onSelect={(skill) => void handleSelectSkill(skill, slashPrefix)}
          onClose={() => setIsSlashOpen(false)}
        />
      )}

      {/* 3. 全局调色板 (Alt+P) */}
      {isPaletteOpen && (
        <QuickPalette
          skills={skills}
          onSelect={(skill) => void handleSelectSkill(skill, "")}
          onClose={() => setIsPaletteOpen(false)}
          onOpenManager={() => {
            chrome.runtime.sendMessage({ action: "open_manager" });
          }}
        />
      )}

      {/* 4. 输入框悬浮轻量胶囊按钮（未挂载标签时展示） */}
      {capsulePos && activeTags.length === 0 && !isPaletteOpen && !isSlashOpen && (
        <FloatingButton
          position={capsulePos}
          onClick={() => setIsPaletteOpen(true)}
        />
      )}
    </>
  );
};
