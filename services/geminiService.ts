interface AISettings {
  apiUrl: string;
  apiToken: string;
  systemPrompt: string;
  model: string;
}

const STORAGE_KEY = "prompt-print-settings";

const loadSettings = (): AISettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        apiUrl: parsed.apiUrl || "",
        apiToken: parsed.apiToken || "",
        systemPrompt: parsed.systemPrompt || "",
        model: parsed.model || "gpt-3.5-turbo",
      };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return {
    apiUrl: "",
    apiToken: "",
    systemPrompt: "",
    model: "gpt-3.5-turbo",
  };
};

// Demo模式的Todo List响应
const DEMO_TODO_LISTS = [
  `□ 检查邮件和消息
□ 完成项目报告
□ 安排午餐会议
□ 更新任务清单`,

  `□ 复习会议笔记
□ 准备演讲幻灯片
□ 确认下周日程
□ 发送进度更新`,

  `□ 学习新技能
□ 运动30分钟
□ 阅读一章书
□ 反思一天收获`,

  `□ 代码审查
□ 修复bug报告
□ 更新文档
□ 测试新功能`,

  `□ 早晨冥想
□ 喝足够的水
□ 处理关键任务
□ 晚间总结`,
];

// 使用自定义API生成内容
const generateWithCustomAPI = async (
  settings: AISettings,
  promptContent: string,
): Promise<string> => {
  // 如果提示词中包含 "todo"，添加特殊指令
  const todoInstruction = promptContent.toLowerCase().includes("todo")
    ? "\n\n生成格式: 每行一个待办事项，以 □ 开头，4-6 个待办项"
    : "";

  const response = await fetch(settings.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiToken}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: "system", content: promptContent + todoInstruction },
        { role: "user", content: "Generate content now. Keep it concise." },
      ],
      max_tokens: 300,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content?.trim() || "System Error: Ink depleted."
  );
};

// 根据主题生成 Todo List
const generateTodoListFromTopic = (topic: string): string => {
  // 一些常见主题的预定义 Todo List 模板
  const todoTemplates: Record<string, string[]> = {
    工作: [
      "□ 检查邮件和消息",
      "□ 完成项目报告",
      "□ 参加团队会议",
      "□ 更新任务进度",
      "□ 代码审查",
      "□ 修复 bug",
    ],
    学习: [
      "□ 学习新技能",
      "□ 完成练习题",
      "□ 阅读一章书",
      "□ 做笔记总结",
      "□ 复习之前内容",
      "□ 参加讨论",
    ],
    健康: [
      "□ 早晨冥想",
      "□ 运动30分钟",
      "□ 喝足够的水",
      "□ 吃健康午餐",
      "□ 晚间瑜伽",
      "□ 早睡早起",
    ],
    家务: [
      "□ 整理房间",
      "□ 打扫卫生",
      "□ 洗衣服",
      "□ 做饭",
      "□ 清理厨房",
      "□ 整理文件",
    ],
    个人: [
      "□ 反思一天收获",
      "□ 制定明日计划",
      "□ 整理思绪",
      "□ 记录灵感",
      "□ 检查目标进度",
      "□ 自我提升",
    ],
  };

  // 检查输入是否包含常见主题关键词
  for (const [key, templates] of Object.entries(todoTemplates)) {
    if (topic.toLowerCase().includes(key)) {
      const randomIndex = Math.floor(Math.random() * templates.length);
      return templates.slice(randomIndex, randomIndex + 5).join("\n");
    }
  }

  // 如果输入含有 "todo" 或 "待办"，返回通用列表
  if (
    topic.toLowerCase().includes("todo") ||
    topic.includes("待办") ||
    topic.includes("计划")
  ) {
    const DEMO_TODO_LISTS = [
      `□ 检查邮件和消息
□ 完成项目报告
□ 安排午餐会议
□ 更新任务清单`,
      `□ 复习会议笔记
□ 准备演讲幻灯片
□ 确认下周日程
□ 发送进度更新`,
      `□ 学习新技能
□ 运动30分钟
□ 阅读一章书
□ 反思一天收获`,
      `□ 代码审查
□ 修复bug报告
□ 更新文档
□ 测试新功能`,
      `□ 早晨冥想
□ 喝足够的水
□ 处理关键任务
□ 晚间总结`,
    ];
    const randomIndex = Math.floor(Math.random() * DEMO_TODO_LISTS.length);
    return DEMO_TODO_LISTS[randomIndex];
  }

  // 默认返回通用 Todo 列表
  return `□ 审查输入内容
□ 分析关键要点
□ 制定行动计划
□ 设定优先级
□ 安排时间表`;
};

// 根据提示词模板生成内容
export const generateWithPrompt = async (
  promptContent: string,
): Promise<string> => {
  console.log("generateWithPrompt called with:", promptContent);

  const settings = loadSettings();
  console.log("Settings loaded:", {
    hasUrl: !!settings.apiUrl,
    hasToken: !!settings.apiToken,
  });

  try {
    // 如果配置了自定义API，使用它
    if (settings.apiUrl && settings.apiToken) {
      console.log("Using custom API");
      return await generateWithCustomAPI(settings, promptContent);
    }

    // 否则使用Demo模式 - 根据是否提到todo决定返回格式
    console.log("Using demo mode");

    // 检查是否是生成 Todo 的请求
    if (
      promptContent.toLowerCase().includes("todo") ||
      promptContent.includes("待办")
    ) {
      const result = generateTodoListFromTopic(promptContent);
      console.log("Demo Todo result:", result);
      return result;
    }

    // 原始的单行响应
    const DEMO_RESPONSES = [
      "今天是新的开始，把握每一刻",
      "小步前进，终将抵达目的地",
      "思考、行动、反思、成长",
      "创造力源于日常的积累",
      "保持好奇心，探索未知领域",
      "专注当下，一次做好一件事",
      "记录灵感，它们稍纵即逝",
      "学习新技能，拓展可能性",
      "整理思绪，理清下一步行动",
      "今日事今日毕，不留遗憾",
    ];
    const randomIndex = Math.floor(Math.random() * DEMO_RESPONSES.length);
    const result = DEMO_RESPONSES[randomIndex];
    console.log("Demo single result:", result);
    return result;
  } catch (error) {
    console.error("AI generation failed:", error);
    return "Connection lost... signal weak.";
  }
};

// 保留旧的函数以兼容
export const generateCreativeText = async (topic?: string): Promise<string> => {
  const defaultPrompt = topic
    ? `Write a very short, poetic message about "${topic}". Max 20 words.`
    : "Write a short, cryptic but beautiful sentence. Max 15 words.";

  return generateWithPrompt(defaultPrompt);
};
