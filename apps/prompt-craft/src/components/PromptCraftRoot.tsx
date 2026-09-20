import React, { useEffect, useState, useCallback, useRef } from "react";
import { Skill } from "../types";
import { getAllSkills } from "../services/storage";
import { injectTextIntoElement } from "../services/platformAdapters";
import { extractVariables } from "../services/variableParser";
import { getCaretCoordinates } from "../utils/caretCoordinates";
import { SlashMenu } from "./SlashMenu";
import { QuickPalette } from "./QuickPalette";
import { VariableModal } from "./VariableModal";
import { FloatingButton } from "./FloatingButton";

export const PromptCraftRoot: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  // 1. 斜杠就地补全状态
  const [isSlashOpen, setIsSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPrefix, setSlashPrefix] = useState("/");
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const [activeInputRect, setActiveInputRect] = useState<DOMRect | null>(null);

  // 2. 全局调色板状态 (Alt+P)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // 3. 变量弹窗状态
  const [pendingSkill, setPendingSkill] = useState<Skill | null>(null);

  // 4. 输入框悬浮胶囊状态
  const [capsulePos, setCapsulePos] = useState<{ top: number; left: number } | null>(null);

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

  // 更新输入框悬浮胶囊位置（使用视窗 fixed 坐标系）
  const updateCapsulePosition = useCallback((el: HTMLElement | null) => {
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

  // 执行最终注入
  const handleExecuteInjection = async (text: string, prefixToRemove = "/") => {
    const el = activeElementRef.current || targetElement;
    if (!el) {
      console.warn("PromptCraft: 未找到目标输入框");
      return;
    }

    await injectTextIntoElement(el, text, prefixToRemove);

    // 关闭所有弹窗
    setIsSlashOpen(false);
    setIsPaletteOpen(false);
    setPendingSkill(null);
  };

  // 技能选中处理（判断是否有变量）
  const handleSelectSkill = (skill: Skill, prefixToRemove = "/") => {
    const variables = extractVariables(skill.template);

    // 若无任何变量，毫秒级直接插入
    if (variables.length === 0) {
      void handleExecuteInjection(skill.template, prefixToRemove);
      return;
    }

    // 有变量时，关闭补全/调色板，唤起变量填写弹窗
    setIsSlashOpen(false);
    setIsPaletteOpen(false);
    setPendingSkill(skill);
  };

  // 全局快捷键与事件侦听
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
        updateCapsulePosition(target);
      }
    };

    // 2. 输入侦听：斜杠命令与光标追踪
    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      activeElementRef.current = target;
      setTargetElement(target);
      updateCapsulePosition(target);

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

    // 3. 键盘按键侦听（处理 Alt+P 全局快捷键）
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "p" || e.key === "P" || e.code === "KeyP")) {
        e.preventDefault();
        e.stopPropagation();
        setIsPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("focusin", handleFocusIn, true);
    window.addEventListener("input", handleInput, true);
    window.addEventListener("compositionend", handleInput, true);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("focusin", handleFocusIn, true);
      window.removeEventListener("input", handleInput, true);
      window.removeEventListener("compositionend", handleInput, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [updateCapsulePosition]);

  return (
    <>
      {/* 1. 斜杠就地联想补全气泡 */}
      {isSlashOpen && (
        <SlashMenu
          skills={skills}
          query={slashQuery}
          position={slashPos}
          inputRect={activeInputRect}
          onSelect={(skill) => handleSelectSkill(skill, slashPrefix)}
          onClose={() => setIsSlashOpen(false)}
        />
      )}

      {/* 2. 全局调色板 (Alt+P) */}
      {isPaletteOpen && (
        <QuickPalette
          skills={skills}
          onSelect={(skill) => handleSelectSkill(skill, "")}
          onClose={() => setIsPaletteOpen(false)}
          onOpenManager={() => {
            chrome.runtime.sendMessage({ action: "open_manager" });
          }}
        />
      )}

      {/* 3. 变量填写弹窗 */}
      {pendingSkill && (
        <VariableModal
          skill={pendingSkill}
          onConfirm={(rendered) => handleExecuteInjection(rendered, slashPrefix)}
          onCancel={() => setPendingSkill(null)}
        />
      )}

      {/* 4. 输入框悬浮轻量胶囊按钮 */}
      {capsulePos && !isPaletteOpen && !isSlashOpen && !pendingSkill && (
        <FloatingButton
          position={capsulePos}
          onClick={() => setIsPaletteOpen(true)}
        />
      )}
    </>
  );
};
