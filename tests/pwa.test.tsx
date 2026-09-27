import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { PwaUpdateNotice } from '../src/components/PwaUpdateNotice';

test('PWA update notice offers a deliberate update or later choice', () => {
  const markup = renderToStaticMarkup(<PwaUpdateNotice pending={false} onUpdate={() => {}} onLater={() => {}} />);
  assert.match(markup, /A new version of Prompt Refinery is ready/);
  assert.match(markup, /Update now/);
  assert.match(markup, /Later/);
  assert.match(markup, /aria-live="polite"/);
  const busy = renderToStaticMarkup(<PwaUpdateNotice pending onUpdate={() => {}} onLater={() => {}} />);
  assert.match(busy, /after this operation finishes/);
});
