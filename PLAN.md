# Prompt Print Todo - 重新设计方案

## 需求理解

**应用名称**: Prompt Print Todo

**核心功能**:
1. 管理多个提示词(Prompts)
2. 通过标签检索提示词
3. 根据选中的提示词生成打印卡片

## 数据结构设计

```typescript
// 提示词模板
interface PromptTemplate {
  id: string;
  name: string;           // 提示词名称
  content: string;        // 提示词内容
  tags: string[];         // 标签列表
  createdAt: string;
  updatedAt: string;
}

// 卡片数据 (保留现有结构)
interface CardData {
  id: string;
  text: string;
  promptId?: string;      // 关联的提示词ID
  position: Position;
  zIndex: number;
  rotation: number;
  timestamp: string;
}
```

## UI 布局设计

```
+--------------------------------------------------+
|  PROMPT PRINT TODO                    [设置] [主题] |
+--------------------------------------------------+
|                                                    |
|  +------------+   +----------------------------+   |
|  | 提示词列表  |   |      卡片展示区域           |   |
|  |            |   |                            |   |
|  | [搜索框]   |   |    [打印的卡片可拖拽]        |   |
|  | [标签过滤] |   |                            |   |
|  |            |   |                            |   |
|  | - 提示词1  |   |                            |   |
|  | - 提示词2  |   |                            |   |
|  | - 提示词3  |   |                            |   |
|  |            |   |                            |   |
|  | [+新建]    |   |                            |   |
|  +------------+   +----------------------------+   |
|                                                    |
|              +------------------------+            |
|              |    打印机 UI           |            |
|              |  [选中提示词] [PRINT]  |            |
|              +------------------------+            |
+--------------------------------------------------+
```

## 核心组件

### 1. PromptList (左侧提示词面板)
- 搜索框：按名称/内容搜索
- 标签过滤：点击标签筛选
- 提示词列表：显示所有提示词
- 新建/编辑/删除提示词

### 2. PromptEditor (提示词编辑弹窗)
- 名称输入
- 内容编辑 (多行)
- 标签管理 (添加/删除标签)
- 保存/取消

### 3. Typewriter (打印机 - 改造)
- 显示当前选中的提示词
- 点击提示词可编辑变量
- Print 按钮调用AI生成内容并打印卡片

### 4. 卡片区域 (保留现有)
- 可拖拽卡片
- 拖到历史区归档

## 工作流程

1. **管理提示词**: 用户在左侧面板创建/编辑提示词，添加标签
2. **检索提示词**: 通过搜索或标签过滤找到需要的提示词
3. **选择提示词**: 点击提示词，加载到打印机
4. **生成卡片**: 点击Print，AI根据提示词生成内容，打印成卡片

## 文件修改清单

1. **types.ts** - 添加 PromptTemplate 接口
2. **components/PromptList.tsx** - 新建：左侧提示词列表
3. **components/PromptEditor.tsx** - 新建：提示词编辑器
4. **components/Typewriter.tsx** - 改造：接收选中的提示词
5. **services/promptService.ts** - 新建：提示词CRUD和存储
6. **services/geminiService.ts** - 改造：根据提示词生成内容
7. **App.tsx** - 改造：集成新组件，管理状态
8. **index.html** - 更新标题

## 存储方案

使用 localStorage 存储:
- `prompt-print-prompts`: 提示词列表
- `prompt-print-settings`: 应用设置
- `prompt-print-history`: 历史卡片
