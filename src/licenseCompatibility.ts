// 许可证兼容关系表（独立维护，页面只负责展示）
//
// 方向：依赖许可证 -> 发布许可证，回答“把该依赖放进以此许可证发布的分发包里是否可行”。
// compatible = 兼容；conflict = 冲突；manual = 关系不明/取决于用法，需要人工确认。

export type Verdict = 'compatible' | 'conflict' | 'manual';

export interface CompatResult {
  verdict: Verdict;
  reason: string;
}

// 已收录兼容关系的依赖许可证
export const KNOWN_LICENSES = ['MIT', 'BSD-3-Clause', 'Apache-2.0', 'LGPL-2.1', 'GPL-3.0'] as const;

// 可选的发布许可证
export const RELEASE_LICENSE_OPTIONS = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL-3.0'] as const;

// 兼容矩阵：matrix[依赖许可证][发布许可证]
const matrix: Record<string, Record<string, CompatResult>> = {
  MIT: {
    MIT: {verdict: 'compatible', reason: '同为 MIT，保留版权声明即可兼容。'},
    'Apache-2.0': {verdict: 'compatible', reason: 'MIT 条款宽松，可与 Apache-2.0 一同分发，需保留 MIT 版权声明。'},
    'BSD-3-Clause': {verdict: 'compatible', reason: 'MIT 与 BSD-3-Clause 同属宽松许可，保留版权声明即可共存。'},
    'GPL-3.0': {verdict: 'compatible', reason: 'MIT 代码可以并入 GPL-3.0 项目，但合并后整体需遵守 GPL-3.0 条款。'},
  },
  'BSD-3-Clause': {
    MIT: {verdict: 'compatible', reason: 'BSD-3-Clause 可用于 MIT 项目，需保留版权声明与免责条款。'},
    'Apache-2.0': {verdict: 'compatible', reason: 'BSD-3-Clause 与 Apache-2.0 兼容，分发时保留版权声明与 NOTICE。'},
    'BSD-3-Clause': {verdict: 'compatible', reason: '同为 BSD-3-Clause，保留版权声明与免责条款即可。'},
    'GPL-3.0': {verdict: 'compatible', reason: 'BSD-3-Clause 与 GPL-3.0 单向兼容，并入后整体适用 GPL-3.0。'},
  },
  'Apache-2.0': {
    MIT: {verdict: 'compatible', reason: 'Apache-2.0 可在 MIT 项目中使用，需保留 NOTICE 与专利授权条款，不得附加额外限制。'},
    'Apache-2.0': {verdict: 'compatible', reason: '同为 Apache-2.0，保留 LICENSE 与 NOTICE 即可兼容。'},
    'BSD-3-Clause': {verdict: 'compatible', reason: 'Apache-2.0 与 BSD-3-Clause 兼容，保留 NOTICE 与版权声明即可。'},
    'GPL-3.0': {verdict: 'compatible', reason: 'Apache-2.0 与 GPL-3.0 单向兼容，专利授权条款可与 GPL-3.0 协同。'},
  },
  'LGPL-2.1': {
    MIT: {verdict: 'manual', reason: '能否共存取决于链接方式：动态链接通常允许，静态链接或直接合并代码会触发 copyleft，需要人工确认。'},
    'Apache-2.0': {verdict: 'manual', reason: '能否共存取决于链接方式：动态链接通常允许，静态链接或直接合并代码会触发 copyleft，需要人工确认。'},
    'BSD-3-Clause': {verdict: 'manual', reason: '能否共存取决于链接方式：动态链接通常允许，静态链接或直接合并代码会触发 copyleft，需要人工确认。'},
    'GPL-3.0': {verdict: 'compatible', reason: 'LGPL-2.1 允许按其升级条款以 GPL-3.0 发布，与 GPL-3.0 兼容。'},
  },
  'GPL-3.0': {
    MIT: {verdict: 'conflict', reason: 'GPL-3.0 的 copyleft 要求整体衍生作品以 GPL-3.0 发布，不能与 MIT 发布许可证放进同一分发包。'},
    'Apache-2.0': {verdict: 'conflict', reason: 'GPL-3.0 的 copyleft 要求整体衍生作品以 GPL-3.0 发布，不能与 Apache-2.0 发布许可证放进同一分发包。'},
    'BSD-3-Clause': {verdict: 'conflict', reason: 'GPL-3.0 的 copyleft 要求整体衍生作品以 GPL-3.0 发布，不能与 BSD-3-Clause 发布许可证放进同一分发包。'},
    'GPL-3.0': {verdict: 'compatible', reason: '同为 GPL-3.0，彼此兼容。'},
  },
};

// 判定单个依赖相对发布许可证的兼容结论
export function evaluateCompatibility(depLicense: string, releaseLicense: string): CompatResult {
  const dep = depLicense.trim();
  if (!KNOWN_LICENSES.includes(dep as (typeof KNOWN_LICENSES)[number])) {
    return {verdict: 'manual', reason: `兼容关系表未收录「${depLicense || '未知许可证'}」，无法自动判定，需要人工确认。`};
  }
  const cell = matrix[dep]?.[releaseLicense];
  if (!cell) {
    return {verdict: 'manual', reason: `缺少 ${depLicense} 与 ${releaseLicense} 的兼容关系记录，需要人工确认。`};
  }
  return cell;
}

export const verdictOrder: Verdict[] = ['compatible', 'manual', 'conflict'];
