import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repo = process.cwd();
const tokenPath = path.join(repo, 'design-system', 'tokens', 'design-tokens.json');
const tokens = JSON.parse(await readFile(tokenPath, 'utf8'));
const failures = [];

function get(pathExpression) {
  return pathExpression.split('.').reduce((current, part) => current?.[part], tokens);
}

function parseHex(color) {
  const match = /^#([0-9a-f]{6})$/iu.exec(color);
  if (match === null) {
    throw new Error(`Expected a six-digit hex color, received "${color}".`);
  }

  return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16));
}

function linearize(channel) {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color) {
  const [red, green, blue] = parseHex(color).map(linearize);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastRatio(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort(
    (left, right) => right - left,
  );
  return (light + 0.05) / (dark + 0.05);
}

function assertContrast(foregroundPath, backgroundPath, minimum) {
  const foreground = get(foregroundPath);
  const background = get(backgroundPath);
  const ratio = contrastRatio(foreground, background);

  if (ratio < minimum) {
    failures.push(
      `${foregroundPath} on ${backgroundPath} is ${ratio.toFixed(2)}:1; minimum is ${minimum}:1.`,
    );
  }
}

function remValue(value, pathExpression) {
  const match = /^([0-9.]+)rem$/u.exec(value);
  if (match === null) {
    failures.push(`${pathExpression} must use rem so user font scaling remains available.`);
    return 0;
  }

  return Number.parseFloat(match[1]);
}

function assertPositiveNumber(pathExpression) {
  const value = get(pathExpression);
  if (typeof value !== 'number' || value <= 0) {
    failures.push(`${pathExpression} must be a positive number.`);
  }
}

const textMinimum = get('semantic.accessibility.contrast.textMinimum');
const nonTextMinimum = get('semantic.accessibility.contrast.nonTextMinimum');

for (const [foreground, background] of [
  ['semantic.color.text.primary', 'semantic.color.background.canvas'],
  ['semantic.color.text.primary', 'semantic.color.background.surface'],
  ['semantic.color.text.secondary', 'semantic.color.background.canvas'],
  ['semantic.color.text.secondary', 'semantic.color.background.surface'],
  ['semantic.color.text.muted', 'semantic.color.background.canvas'],
  ['semantic.color.text.inverse', 'semantic.color.action.primary.default'],
  ['semantic.color.text.inverse', 'semantic.color.action.destructive.default'],
  ['semantic.color.feedback.success', 'semantic.color.background.surface'],
  ['semantic.color.feedback.warning', 'semantic.color.background.surface'],
  ['semantic.color.feedback.error', 'semantic.color.background.surface'],
  ['semantic.color.feedback.info', 'semantic.color.background.surface'],
]) {
  assertContrast(foreground, background, textMinimum);
}

for (const [foreground, background] of [
  ['semantic.color.focus.ring', 'semantic.color.background.canvas'],
  ['semantic.color.focus.ring', 'semantic.color.background.surface'],
  ['semantic.color.border.focus', 'semantic.color.background.surface'],
  ['semantic.color.action.primary.default', 'semantic.color.background.surface'],
  ['semantic.color.action.destructive.default', 'semantic.color.background.surface'],
]) {
  assertContrast(foreground, background, nonTextMinimum);
}

for (const pathExpression of [
  'semantic.typography.display.fontSize',
  'semantic.typography.heading.page.fontSize',
  'semantic.typography.heading.section.fontSize',
  'semantic.typography.body.default.fontSize',
  'semantic.typography.body.small.fontSize',
  'semantic.typography.label.default.fontSize',
  'semantic.typography.caption.fontSize',
]) {
  remValue(get(pathExpression), pathExpression);
}

if (
  remValue(
    get('semantic.typography.body.default.fontSize'),
    'semantic.typography.body.default.fontSize',
  ) < 1
) {
  failures.push('semantic.typography.body.default.fontSize must be at least 1rem.');
}

if (
  remValue(get('semantic.typography.caption.fontSize'), 'semantic.typography.caption.fontSize') <
  0.8125
) {
  failures.push('semantic.typography.caption.fontSize must be at least 0.8125rem.');
}

for (const pathExpression of [
  'semantic.typography.display.lineHeight',
  'semantic.typography.heading.page.lineHeight',
  'semantic.typography.heading.section.lineHeight',
  'semantic.typography.body.default.lineHeight',
  'semantic.typography.body.small.lineHeight',
  'semantic.typography.label.default.lineHeight',
  'semantic.typography.caption.lineHeight',
]) {
  assertPositiveNumber(pathExpression);
}

if (get('semantic.accessibility.fontScaling.minimumSupportedScale') !== 1) {
  failures.push('semantic.accessibility.fontScaling.minimumSupportedScale must be 1.');
}

if (get('semantic.accessibility.fontScaling.maximumSupportedScale') < 2) {
  failures.push(
    'semantic.accessibility.fontScaling.maximumSupportedScale must support at least 2x.',
  );
}

if (
  remValue(get('semantic.control.minimumTouchTarget'), 'semantic.control.minimumTouchTarget') < 2.75
) {
  failures.push(
    'semantic.control.minimumTouchTarget must be at least 2.75rem (44 CSS px at 16px root).',
  );
}

if (remValue(get('semantic.control.focusRingWidth'), 'semantic.control.focusRingWidth') < 0.125) {
  failures.push(
    'semantic.control.focusRingWidth must be at least 0.125rem (2 CSS px at 16px root).',
  );
}

if (get('semantic.motion.reduced') !== '0ms') {
  failures.push('semantic.motion.reduced must be 0ms for reduced-motion platform adapters.');
}

for (const forbiddenPathFragment of [
  'web',
  'ios',
  'android',
  'wx',
  'tailwind',
  'rounded',
  'slate',
]) {
  if (JSON.stringify(tokens.semantic).toLowerCase().includes(forbiddenPathFragment)) {
    failures.push(
      `Semantic Token source must not contain platform or implementation term "${forbiddenPathFragment}".`,
    );
  }
}

if (failures.length > 0) {
  console.error('Design Token calibration failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Design Token calibration passed.');
