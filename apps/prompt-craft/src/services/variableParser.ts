import { SkillVariable, VariableInputType } from "../types";

/**
 * 变量语法正则：匹配形如 {变量名}、{说明:textarea}、{选项:A|B|C}、{语言=中文}
 */
const VARIABLE_REGEX = /\{([^}]+)\}/g;

/**
 * 从模板字符串中解析出所有变量定义
 */
export function extractVariables(template: string): SkillVariable[] {
  const variables: SkillVariable[] = [];
  const seenKeys = new Set<string>();

  const matches = template.matchAll(VARIABLE_REGEX);

  for (const match of matches) {
    const rawExpression = match[1].trim();
    if (!rawExpression) continue;

    let key = rawExpression;
    let label = rawExpression;
    let type: VariableInputType = "text";
    let options: string[] | undefined = undefined;
    let defaultValue: string | undefined = undefined;

    // 解析默认值语法，如 {语言=中文}
    if (rawExpression.includes("=")) {
      const [left, right] = rawExpression.split("=");
      key = left.trim();
      label = left.trim();
      defaultValue = right.trim();
    }

    // 解析类型或选项语法，如 {内容:textarea} 或 {风格:专业|轻松|幽默}
    if (key.includes(":")) {
      const [actualKey, modifier] = key.split(":");
      key = actualKey.trim();
      label = actualKey.trim();

      const trimmedModifier = modifier.trim();
      if (trimmedModifier.toLowerCase() === "textarea") {
        type = "textarea";
      } else if (trimmedModifier.includes("|")) {
        type = "select";
        options = trimmedModifier
          .split("|")
          .map((opt) => opt.trim())
          .filter(Boolean);
        if (options.length > 0 && !defaultValue) {
          defaultValue = options[0];
        }
      }
    }

    // 去重
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      variables.push({
        key,
        label,
        type,
        options,
        defaultValue,
      });
    }
  }

  return variables;
}

/**
 * 将用户填写的变量值替换回模板中，生成最终发送给大模型的完整 Prompt
 */
export function renderTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(VARIABLE_REGEX, (fullMatch, rawExpression) => {
    const trimmed = rawExpression.trim();
    // 提取 key
    let key = trimmed;
    if (key.includes("=")) {
      key = key.split("=")[0].trim();
    }
    if (key.includes(":")) {
      key = key.split(":")[0].trim();
    }

    // 如果用户有输入值，返回输入值；若无输入则查看是否有默认值，否则保留原样或空白
    if (values[key] !== undefined && values[key] !== "") {
      return values[key];
    }

    // 尝试提取默认值
    if (trimmed.includes("=")) {
      return trimmed.split("=")[1].trim();
    }

    // select 候选第一个
    if (trimmed.includes(":")) {
      const mod = trimmed.split(":")[1].trim();
      if (mod.includes("|")) {
        return mod.split("|")[0].trim();
      }
    }

    return values[key] || "";
  });
}
