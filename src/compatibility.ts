// 许可证兼容关系 —— 单独维护，页面只负责展示结论。
// 行 = 依赖的许可证，列 = 项目的发布许可证。
// compatible 兼容 / review 需要人工确认 / conflict 冲突。

export type CompatStatus = 'compatible' | 'review' | 'conflict';

export const RELEASE_LICENSES = ['MIT', 'BSD-3-Clause', 'Apache-2.0', 'GPL-3.0', 'Proprietary'] as const;
export type ReleaseLicense = (typeof RELEASE_LICENSES)[number];

export const RELEASE_LABELS: Record<ReleaseLicense, string> = {
  MIT: 'MIT',
  'BSD-3-Clause': 'BSD-3-Clause',
  'Apache-2.0': 'Apache-2.0',
  'GPL-3.0': 'GPL-3.0',
  Proprietary: '专有（闭源）',
};

// 添加依赖时可选的许可证
export const DEP_LICENSES = ['MIT', 'BSD-3-Clause', 'Apache-2.0', 'MPL-2.0', 'LGPL-3.0', 'GPL-3.0', 'AGPL-3.0', '未知'];

const MATRIX: Record<string, Record<ReleaseLicense, CompatStatus>> = {
  MIT:            {MIT: 'compatible', 'BSD-3-Clause': 'compatible', 'Apache-2.0': 'compatible', 'GPL-3.0': 'compatible', Proprietary: 'compatible'},
  'BSD-3-Clause': {MIT: 'compatible', 'BSD-3-Clause': 'compatible', 'Apache-2.0': 'compatible', 'GPL-3.0': 'compatible', Proprietary: 'compatible'},
  'Apache-2.0':   {MIT: 'compatible', 'BSD-3-Clause': 'compatible', 'Apache-2.0': 'compatible', 'GPL-3.0': 'compatible', Proprietary: 'compatible'},
  'MPL-2.0':      {MIT: 'compatible', 'BSD-3-Clause': 'compatible', 'Apache-2.0': 'compatible', 'GPL-3.0': 'compatible', Proprietary: 'compatible'},
  'LGPL-3.0':     {MIT: 'review',     'BSD-3-Clause': 'review',     'Apache-2.0': 'review',     'GPL-3.0': 'compatible', Proprietary: 'review'},
  'GPL-3.0':      {MIT: 'conflict',   'BSD-3-Clause': 'conflict',   'Apache-2.0': 'conflict',   'GPL-3.0': 'compatible', Proprietary: 'conflict'},
  'AGPL-3.0':     {MIT: 'conflict',   'BSD-3-Clause': 'conflict',   'Apache-2.0': 'conflict',   'GPL-3.0': 'compatible', Proprietary: 'conflict'},
  '未知':          {MIT: 'review',     'BSD-3-Clause': 'review',     'Apache-2.0': 'review',     'GPL-3.0': 'review',     Proprietary: 'review'},
};

// 每种许可证在不同结论下的原因说明（许可证对由 evaluate 拼接）
const NOTES: Record<string, Partial<Record<CompatStatus, string>>> = {
  MIT: {compatible: '宽松许可证，仅需保留版权与许可声明'},
  'BSD-3-Clause': {compatible: '宽松许可证，再分发时需保留版权声明'},
  'Apache-2.0': {compatible: '宽松许可证，需保留声明并遵守专利授权条款'},
  'MPL-2.0': {compatible: '文件级弱 copyleft，修改过的 MPL 文件需继续开源'},
  'LGPL-3.0': {
    compatible: '可随 GPL-3.0 项目一起分发',
    review: '弱 copyleft，是否可用取决于链接方式与再分发形式',
  },
  'GPL-3.0': {
    compatible: '与发布许可证同为 GPL-3.0，copyleft 要求一致',
    conflict: '强 copyleft，要求衍生作品整体以 GPL-3.0 发布',
  },
  'AGPL-3.0': {
    compatible: 'GPL-3.0 第 13 条允许与 AGPL-3.0 结合',
    conflict: '网络交互即触发开源义务，衍生作品须以 AGPL-3.0 发布',
  },
  '未知': {review: '未识别的许可证，无法自动判定'},
};

export interface CompatResult {
  status: CompatStatus;
  /** 结论说明，始终点名「依赖许可证 × 发布许可证」这对组合 */
  reason: string;
}

export function evaluate(depLicense: string, release: ReleaseLicense): CompatResult {
  const status: CompatStatus = MATRIX[depLicense]?.[release] ?? 'review';
  const note = NOTES[depLicense]?.[status] ?? '未识别的许可证，无法自动判定';
  const pair = `${depLicense}（依赖）× ${RELEASE_LABELS[release]}（发布）`;
  const verdict = status === 'compatible' ? '兼容' : status === 'conflict' ? '冲突' : '需人工确认';
  return {status, reason: `${pair}${verdict}：${note}`};
}
