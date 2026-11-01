import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, Truck } from 'lucide-react'

export default function Chat({ rides, threads, onSendMessage }) {
  const [activeRideId, setActiveRideId] = useState(rides[0]?.id ?? null)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!activeRideId && rides.length) setActiveRideId(rides[0].id)
  }, [rides, activeRideId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threads, activeRideId])

  const activeRide = rides.find((r) => r.id === activeRideId)
  const messages = threads[activeRideId] ?? []

  const handleSend = (e) => {
    e.preventDefault()
    if (!draft.trim() || !activeRideId) return
    onSendMessage(activeRideId, { from: 'shipper', text: draft.trim(), time: new Date().toLocaleTimeString() })
    setDraft('')
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-6xl flex-col px-6 py-10 md:px-10 md:py-14">
      <span className="label-eyebrow">Driver chat</span>
      <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-semibold text-mist md:text-4xl">
        <MessageSquare className="text-transit" size={30} />
        Ride conversations
      </h1>

      <div className="mt-8 grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-3">
        <div className="neu-panel overflow-y-auto p-4 md:col-span-1">
          {rides.length === 0 && (
            <p className="p-4 text-center font-body text-sm text-mist-faint">Book a ride to start a conversation.</p>
          )}
          {rides.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRideId(r.id)}
              className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                activeRideId === r.id ? 'bg-ink-soft shadow-neu-in' : 'hover:bg-ink-soft/60'
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-panel text-beacon shadow-neu-sm">
                <Truck size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-medium text-mist">{r.driver.name}</p>
                <p className="truncate font-mono text-[10px] text-mist-faint">{r.id}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="neu-panel flex min-h-0 flex-col md:col-span-2">
          {activeRide ? (
            <>
              <div className="flex items-center gap-3 border-b border-white/[0.05] px-6 py-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-soft text-transit shadow-neu-in">
                  <Truck size={16} />
                </span>
                <div>
                  <p className="font-body text-sm font-medium text-mist">{activeRide.driver.name}</p>
                  <p className="font-mono text-[10px] text-mist-faint">{activeRide.driver.vehicle}</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
                {messages.length === 0 && (
                  <p className="pt-10 text-center font-body text-sm text-mist-faint">
                    No messages yet. Say hello to {activeRide.driver.name.split(' ')[0]}.
                  </p>
                )}
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.from === 'shipper' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 font-body text-sm ${
                        m.from === 'shipper' ? 'bg-gradient-to-br from-beacon to-transit text-ink' : 'neu-inset text-mist'
                      }`}
                    >
                      <p>{m.text}</p>
                      <p className={`mt-1 font-mono text-[10px] ${m.from === 'shipper' ? 'text-ink/60' : 'text-mist-faint'}`}>
                        {m.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-white/[0.05] px-6 py-4">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Message the driver…"
                  className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                />
                <button type="submit" className="neu-btn grid h-11 w-11 shrink-0 place-items-center text-transit">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center">
              <p className="font-body text-sm text-mist-faint">Select a ride to open its conversation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
