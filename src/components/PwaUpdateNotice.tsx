export function PwaUpdateNotice({ pending, onUpdate, onLater }: { pending: boolean; onUpdate: () => void; onLater: () => void }) {
  return <aside className="pwa-update-notice" role="status" aria-live="polite">
    <span>A new version of Prompt Refinery is ready.{pending ? ' It will update after this operation finishes.' : ''}</span>
    <div className="flex gap-2"><button type="button" onClick={onUpdate}>Update now</button><button type="button" onClick={onLater}>Later</button></div>
  </aside>;
}
