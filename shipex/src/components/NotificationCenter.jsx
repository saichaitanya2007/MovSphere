import { useState } from 'react'
import { Bell, CheckCircle2 } from 'lucide-react'

export default function NotificationCenter({ localNotifications = [], serverNotifications = [], onMarkRead }) {
  const [open, setOpen] = useState(false)
  const notifications = [
    ...serverNotifications.map((item) => ({ ...item, id: `server-${item.id}`, serverId: item.id, time: item.createdAt })),
    ...localNotifications,
  ].slice(0, 30)
  const unread = serverNotifications.filter((item) => !item.read).length

  return (
    <div className="fixed right-5 top-5 z-[60] md:right-8 md:top-7">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Open notifications"
        className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-slate-950/65 text-mist shadow-[0_18px_50px_rgba(0,0,0,.28)] backdrop-blur-xl transition hover:bg-white/15"
      >
        <Bell size={19} />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-beacon px-1 font-mono text-[10px] text-ink">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/15 bg-[#0b1728]/95 shadow-[0_25px_80px_rgba(0,0,0,.5)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-display font-semibold text-mist">Notifications</p>
            <span className="text-xs text-mist-faint">{notifications.length} recent</span>
          </div>
          <div className="max-h-[24rem] overflow-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-mist-muted">You are all caught up.</p>
            ) : notifications.map((item) => {
              const content = (
                <span className="flex gap-3 border-b border-white/[.06] px-4 py-3 text-left">
                  <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${item.read ? 'text-mist-faint' : 'text-transit'}`} />
                  <span>
                    <span className="block text-sm leading-5 text-mist">{item.message}</span>
                    <span className="mt-1 block text-[11px] text-mist-faint">{item.time ? new Date(item.time).toLocaleString('en-IN') : 'Just now'}</span>
                  </span>
                </span>
              )

              return item.serverId ? (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !item.read && onMarkRead?.(item.serverId)}
                  aria-label={item.read ? item.message : `Mark as read: ${item.message}`}
                  className="block w-full hover:bg-white/[.04]"
                >
                  {content}
                </button>
              ) : <div key={item.id}>{content}</div>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
