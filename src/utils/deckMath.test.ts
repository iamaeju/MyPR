import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyEdgeResistance,
  computeCardVisualState,
  computeVirtualIndex,
  didPointerDrag,
  getContrastInk,
  normalizeExternalUrl,
  reorderCards,
  resolveSwipeTarget,
} from './deckMath';
import { DEFAULT_CARDS } from '../data/defaultCards';

test('computeCardVisualState keeps active card centered at full scale and top z-index', () => {
  const active = computeCardVisualState(0, 260);
  assert.equal(active.translateY, 0);
  assert.equal(active.scale, 1);
  assert.equal(active.zIndex, 100);
  assert.equal(active.isVisible, true);
});

test('computeCardVisualState positions previous cards above and upcoming cards below with lower z-index', () => {
  const above = computeCardVisualState(-1, 260);
  const below = computeCardVisualState(1, 260);
  assert.ok(above.translateY < 0, 'offset -1 should sit above active card');
  assert.ok(below.translateY > 0, 'offset +1 should sit below active card');
  assert.ok(above.scale < 1 && below.scale < 1);
  assert.ok(above.zIndex < 100 && below.zIndex < 100);
});

test('resolveSwipeTarget advances on upward swipe/flick and goes back on downward swipe/flick', () => {
  assert.equal(resolveSwipeTarget(2, 7, -60, 0, 135), 3);
  assert.equal(resolveSwipeTarget(2, 7, 60, 0, 135), 1);
  assert.equal(resolveSwipeTarget(2, 7, -15, -0.5, 135), 3);
  assert.equal(resolveSwipeTarget(2, 7, 15, 0.5, 135), 1);
  assert.equal(resolveSwipeTarget(2, 7, -10, 0, 135), 2);
});

test('resolveSwipeTarget clamps at deck boundaries', () => {
  assert.equal(resolveSwipeTarget(0, 7, 100, 0.6, 135), 0);
  assert.equal(resolveSwipeTarget(6, 7, -100, -0.6, 135), 6);
});

test('applyEdgeResistance dampens drag beyond boundaries', () => {
  assert.equal(applyEdgeResistance(100, 0, 5), 28);
  assert.equal(applyEdgeResistance(-100, 4, 5), -28);
  assert.equal(applyEdgeResistance(-100, 1, 5), -100);
});

test('computeVirtualIndex maps negative drag to forward progression', () => {
  assert.equal(computeVirtualIndex(2, 7, -135, 135), 3);
  assert.equal(computeVirtualIndex(2, 7, 135, 135), 1);
});

test('didPointerDrag separates taps from drags accurately', () => {
  assert.equal(didPointerDrag(100, 100, 103, 104), false);
  assert.equal(didPointerDrag(100, 100, 100, 115), true);
});

test('getContrastInk selects readable ink color for light and dark backgrounds', () => {
  assert.equal(getContrastInk('#FFFFFF'), 'dark');
  assert.equal(getContrastInk('#E8E5DC'), 'dark');
  assert.equal(getContrastInk('#141413'), 'light');
  assert.equal(getContrastInk('#2B2420'), 'light');
});

test('normalizeExternalUrl accepts safe links, prefixes https, and rejects unsafe schemes', () => {
  assert.equal(normalizeExternalUrl(''), null);
  assert.equal(normalizeExternalUrl('   '), null);
  assert.equal(normalizeExternalUrl('behance.net/sora'), 'https://behance.net/sora');
  assert.equal(normalizeExternalUrl('https://instagram.com/sora'), 'https://instagram.com/sora');
  assert.equal(normalizeExternalUrl('mailto:hello@mypr.me'), 'mailto:hello@mypr.me');
  assert.equal(normalizeExternalUrl('javascript:alert(1)'), null);
  assert.equal(normalizeExternalUrl('data:text/html,<script>'), null);
});

test('reorderCards moves items immutably without losing cards', () => {
  const reordered = reorderCards(DEFAULT_CARDS, 0, 2);
  assert.equal(reordered.length, DEFAULT_CARDS.length);
  assert.equal(reordered[2].id, DEFAULT_CARDS[0].id);
  assert.notEqual(reordered, DEFAULT_CARDS);
});
