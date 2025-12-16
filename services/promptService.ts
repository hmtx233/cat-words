import { PromptTemplate } from "../types";

const STORAGE_KEY = "prompt-print-prompts";

// 默认提示词模板
const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: "1",
    name: "Daily Todo",
    content:
      "Generate a motivational todo item for today's work. Keep it short and actionable.",
    tags: ["work", "daily"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Creative Idea",
    content:
      "Generate a creative project idea in one sentence. Be inspiring and unique.",
    tags: ["creative", "ideas"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Learning Goal",
    content:
      "Suggest one specific thing to learn today. Be concrete and achievable.",
    tags: ["learning", "daily"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Task-to-Todo List Generator",
    content: `Break down the following task into a specific, actionable, and sequential todo list with clear steps. Each todo item should:
    Be concise (1-2 sentences max)
    Focus on a single action (avoid vague or multi-step items)
    Include relevant details (e.g., tools, deadlines, dependencies, if applicable)
    Follow a logical order (start with prerequisites, end with final checks)
    If the original task lacks context (e.g., no deadline, unclear scope), add reasonable assumptions as optional todo items or notes.
    Task: [PASTE YOUR TASK HERE]
    Format the output as a numbered list with clear, actionable verbs. Example structure:
    [Action verb] [specific task detail] (e.g., "Research 3 project management tools compatible with Slack by EOD Friday")
    [Action verb] [specific task detail] (e.g., "Draft a 1-page project timeline using Google Sheets")
    [Action verb] [specific task detail] (e.g., "Share the timeline with the team for feedback via email")
    [Action verb] [specific task detail] (e.g., "Revise the timeline based on team comments and finalize by Monday")"
    How to Use:
    Replace [PASTE YOUR TASK HERE] with your actual task (e.g., "Plan a company team-building event for 20 people in 4 weeks").
    The output will be a structured todo list with actionable steps, no extra fluff.
    Example Output (for task: "Plan a company team-building event for 20 people in 4 weeks"):
    Survey the team to collect preferences (e.g., outdoor vs. indoor, budget range) by EOD Wednesday.
    Research 3 team-building venues in the city that fit the budget and capacity (20 people) by Friday.
    Contact selected venues to check availability for the target date (4 weeks from now) and request quotes by Monday.
    Compare venue quotes, amenities, and logistics (parking, catering options) to narrow down to 1 choice by Tuesday.
    Draft an event agenda (2-3 hours, including activities and breaks) using Google Docs by Wednesday.
    Share the venue choice and agenda with the team lead for approval by EOD Thursday.
    Send a calendar invite to all team members with event details (time, location, dress code) by Friday.
    Coordinate with the venue for catering (allergies noted from the initial survey) 2 weeks before the event.
    Prepare small team-building materials (e.g., name tags, activity supplies) 3 days before the event.
    Confirm final headcount with the venue 1 week before the event and send a reminder to the team.`,
    tags: ["personal", "daily"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 加载所有提示词
export const loadPrompts = (): PromptTemplate[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load prompts:", e);
  }
  // 首次使用返回默认提示词
  savePrompts(DEFAULT_PROMPTS);
  return DEFAULT_PROMPTS;
};

// 保存所有提示词
export const savePrompts = (prompts: PromptTemplate[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch (e) {
    console.error("Failed to save prompts:", e);
  }
};

// 添加提示词
export const addPrompt = (
  prompt: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">,
): PromptTemplate => {
  const prompts = loadPrompts();
  const newPrompt: PromptTemplate = {
    ...prompt,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  prompts.push(newPrompt);
  savePrompts(prompts);
  return newPrompt;
};

// 更新提示词
export const updatePrompt = (
  id: string,
  updates: Partial<Omit<PromptTemplate, "id" | "createdAt">>,
): PromptTemplate | null => {
  const prompts = loadPrompts();
  const index = prompts.findIndex((p) => p.id === id);
  if (index === -1) return null;

  prompts[index] = {
    ...prompts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  savePrompts(prompts);
  return prompts[index];
};

// 删除提示词
export const deletePrompt = (id: string): boolean => {
  const prompts = loadPrompts();
  const filtered = prompts.filter((p) => p.id !== id);
  if (filtered.length === prompts.length) return false;
  savePrompts(filtered);
  return true;
};

// 获取所有标签
export const getAllTags = (): string[] => {
  const prompts = loadPrompts();
  const tagSet = new Set<string>();
  prompts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
};

// 按标签筛选
export const filterByTag = (tag: string): PromptTemplate[] => {
  const prompts = loadPrompts();
  return prompts.filter((p) => p.tags.includes(tag));
};

// 搜索提示词
export const searchPrompts = (query: string): PromptTemplate[] => {
  const prompts = loadPrompts();
  const lowerQuery = query.toLowerCase();
  return prompts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery) ||
      p.tags.some((t) => t.toLowerCase().includes(lowerQuery)),
  );
};
