import { FileItem } from "../types";

/**
 * 内置开箱即用示例项目
 * 完整还原用户参考图中的小说与大纲结构，并包含代码与纯文本格式示例
 */
export const DEMO_PROJECT: FileItem = {
  id: "root-demo",
  name: "知意逆袭审计局",
  path: "/",
  type: "directory",
  children: [
    {
      id: "folder-cover",
      name: "封面",
      path: "/封面",
      type: "directory",
      children: [
        {
          id: "file-cover-info",
          name: "作品信息.md",
          path: "/封面/作品信息.md",
          type: "file",
          extension: "md",
          category: "markdown",
          language: "markdown",
          content: `# 《豪门假债：顶级审计师妻子的复仇反击》

- **主角**：沈知意（前国际四大最年轻资深审计经理，全职太太）、顾诚（凤凰男逆袭丈夫）、宋曼（小三）
- **类型**：商战、逆袭、打脸、悬疑复仇
- **字数规划**：50万字
- **状态**：连载中
- **简介**：结婚第四年，丈夫深夜拿一份三千两百万假账逼我替他背债一千六百万，妄图金蝉脱壳转移八千万婚内财产。他不知道，在我这个顶级审计师眼里，他的账本破绽百出！`,
        },
      ],
    },
    {
      id: "folder-archive",
      name: "archive_deslop_20260827",
      path: "/archive_deslop_20260827",
      type: "directory",
      children: [
        {
          id: "file-setting",
          name: "设定.md",
          path: "/archive_deslop_20260827/设定.md",
          type: "file",
          extension: "md",
          category: "markdown",
          language: "markdown",
          content: `# 人物与世界观设定

### 1. 核心人物设定
- **沈知意**：29岁。曾任国际四大资深审计经理，擅长资金穿透、壳公司识别、假票据鉴定与离岸账户追踪。三年前生下女儿念念后短暂退居幕后。
- **顾诚**：31岁。科技公司表面创始人，野心极大但商业道德底线低，擅长PUA与伪装深情。
- **宋曼**：26岁。表面是曼诚贸易实控人，实际是顾诚暗中扶持的转移资产白手套。

### 2. 关键线索
1. **公章防伪漏洞**：假公章油墨边缘不均，流水号漏第12位校验位。
2. **离岸空壳链路**：香港华腾资本 -> 曼诚贸易 -> 顾诚私人海外离岸账户。
3. **关键证据**：酒店宴会厅八千万穿透资金全息流水投影图。`,
        },
        {
          id: "file-outline",
          name: "小节大纲.md",
          path: "/archive_deslop_20260827/小节大纲.md",
          type: "file",
          extension: "md",
          category: "markdown",
          language: "markdown",
          content: `# 小节大纲规划

### 第1节：深夜暴雷逼宫
- 顾诚深夜醉酒哭求背债1600万，递出假借款协议与离婚书。
- 知意三秒看破假公章破绽，不动声色稳住对方。

### 第2节：天网查账查穿底细
- 知意借口查账，调取公司近年流水与上下游开票记录。
- 锁定“曼诚贸易”空壳公司与八千万财产转移蛛丝马迹。

### 第3节：反向做局设伏
- 假意妥协同意在庆功宴当众签字。
- 暗中联络经侦支队与顶级律师团队准备一网打尽。

### 第4节：五星宴会厅全息打脸
- 顾诚与宋曼洋洋得意，知意切断大屏幕投影。
- 资金穿透全息图曝光，银手镯当场铐走两人。`,
        },
        {
          id: "file-main",
          name: "正文.md",
          path: "/archive_deslop_20260827/正文.md",
          type: "file",
          extension: "md",
          category: "markdown",
          language: "markdown",
          content: `结婚第四年，创业成功的丈夫深夜跪在我面前，递来一份三千两百万的暴雷借款保证书与离婚协议，求我为了孩子替他背下一千六百万的债务。

他以为脱节社会三年的全职太太是个任人宰割的软柿子，却不知我曾是顶级会计事务所最年轻的资深审计经理。

当他在五星级酒店宴会厅得意洋洋逼我按手印时，大屏幕上亮起的八千万资金穿透全息图，送了他和小三一人一副冰冷的银手镯。

### 1.
深夜一点，大门被钥匙拧得咔嚓作响。

顾诚带着一身刺鼻的浓烈酒气，脚步虚浮地跌撞进客厅，扑通一声跪倒在我面前，眼眶通红，双手死死攥住我的睡袍下摆。

“知意，我对不起你和念念，公司彻底完了。”

他颤抖着从公文包里抽出两份厚厚的文件，狠狠拍在茶几上。

白纸黑字，《连带清偿保证书》和《自愿离婚协议书》。

“我投的新能源过桥资金链断了，资方抽贷，欠了三千两百万高利贷。债主说明天拿不到钱，就要去幼儿园找念念。”

我端着蜂蜜水的手一顿，目光落在借款合同上。

三秒。

就三秒，我认出了借款方曼诚贸易的公章，油墨边缘不均匀，防伪纹路有断层重影；流水号第十二位，还漏了一个校验位。

假的。

三千两百万的暴雷，从头到尾是一场杀妻局。

“知意，你脱节职场三年了，不懂这些。”顾诚还在死死盯着我的眼睛，一字一句地说，“只要你签了字，他们就不会去动念念。”

我压下翻江倒海的寒意。

他大概忘了，脱节职场三年之前，我是国际四大最年轻的资深审计经理，经手过几十起百亿并购审计。

他手里这份逼我背一千六百万债务的假账本，拙劣得让我想笑。

我抬手轻轻擦去他脸上的泪，柔声道：

“这么大的事，总得让我看仔细。明天一早，我给你答复。”`,
        },
      ],
    },
    {
      id: "folder-code",
      name: "代码与数据示例",
      path: "/代码与数据示例",
      type: "directory",
      children: [
        {
          id: "file-audit-code",
          name: "auditService.ts",
          path: "/代码与数据示例/auditService.ts",
          type: "file",
          extension: "ts",
          category: "code",
          language: "typescript",
          content: `/**
 * 资金穿透与真伪校验审计服务
 */
export interface AuditTransaction {
  id: string;
  sourceAccount: string;
  targetAccount: string;
  amount: number;
  timestamp: number;
  flowCode: string;
}

export class TransactionAuditManager {
  private threshold = 10_000_000;

  // 校验流水号校验码规则
  public verifyFlowCode(code: string): boolean {
    if (code.length !== 16) return false;
    const checkDigit = Number(code[11]);
    const computedSum = code
      .split("")
      .slice(0, 11)
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return computedSum % 9 === checkDigit;
  }

  // 穿透可疑资金链路
  public traceSuspiciousFlow(txList: AuditTransaction[]): AuditTransaction[] {
    return txList.filter((tx) => {
      const isLargeAmount = tx.amount >= this.threshold;
      const isInvalidCode = !this.verifyFlowCode(tx.flowCode);
      return isLargeAmount || isInvalidCode;
    });
  }
}`,
        },
        {
          id: "file-config-json",
          name: "config.json",
          path: "/代码与数据示例/config.json",
          type: "file",
          extension: "json",
          category: "code",
          language: "json",
          content: `{
  "projectName": "TreeReader",
  "version": "1.2.0",
  "author": "Antigravity",
  "license": "MIT",
  "viewer": {
    "theme": "light",
    "fontSize": 16,
    "lineNumbers": true,
    "wordWrap": true
  },
  "supportedFormats": [
    "md",
    "ts",
    "js",
    "py",
    "json",
    "txt",
    "log"
  ]
}`,
        },
        {
          id: "file-server-log",
          name: "server.log",
          path: "/代码与数据示例/server.log",
          type: "file",
          extension: "log",
          category: "text",
          language: "text",
          content: `2026-09-07 10:30:15 [INFO] TreeReader 扩展已就绪
2026-09-07 10:30:16 [INFO] 挂载示例项目: 知意逆袭审计局
2026-09-07 10:30:16 [DEBUG] 索引文件: /archive_deslop_20260827/设定.md (382 bytes)
2026-09-07 10:30:16 [DEBUG] 索引文件: /archive_deslop_20260827/小节大纲.md (420 bytes)
2026-09-07 10:30:16 [DEBUG] 索引文件: /archive_deslop_20260827/正文.md (1450 bytes)
2026-09-07 10:30:17 [INFO] 激活主文件: /archive_deslop_20260827/正文.md
2026-09-07 10:30:18 [SUCCESS] 侧边栏双栏视图就绪，性能耗时 12ms`,
        },
      ],
    },
  ],
};
