/**
 * Attack Simulation — compare AI behavior with vs without prompt-injection defense.
 */
import { useEffect, useState } from 'react'
import { Loader2, Shield, ShieldOff, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  fetchAttackPresets,
  simulateAttack,
  type AttackPreset,
  type AttackSimulateResponse,
} from '../services/securityService'

export default function AttackSimulationPage() {
  const [presets, setPresets] = useState<AttackPreset[]>([])
  const [payload, setPayload] = useState('')
  const [attackName, setAttackName] = useState('custom_attack')
  const [defenseEnabled, setDefenseEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<AttackSimulateResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchAttackPresets()
        if (!cancelled) {
          setPresets(data)
          if (data[0]) {
            setPayload(data[0].payload)
            setAttackName(data[0].name)
          }
        }
      } catch {
        toast.error('Failed to load attack presets')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const onSimulate = async () => {
    if (!payload.trim()) {
      toast.error('Enter an attack payload')
      return
    }
    setRunning(true)
    try {
      const res = await simulateAttack({
        attack_name: attackName,
        payload,
        defense_enabled: defenseEnabled,
      })
      setResult(res)
      toast.success(
        res.comparison.blocked_by_defense
          ? 'Defense blocked the attack'
          : defenseEnabled
            ? 'Simulation complete (defense on)'
            : 'Simulation complete (defense off — unsafe demo)',
      )
    } catch {
      toast.error('Simulation failed')
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading attack lab…
      </div>
    )
  }

  const fieldClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2'

  const without = result?.comparison.without_protection
  const withProt = result?.comparison.with_protection

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Attack Simulation
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Academic demo of prompt-injection attacks. Compare unprotected model
          behavior vs Security Agent defense. Not for real clinical use.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPayload(p.payload)
              setAttackName(p.name)
            }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-left shadow-sm transition hover:border-hospital-400"
          >
            <p className="text-sm font-semibold">{p.name}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{p.description}</p>
          </button>
        ))}
      </div>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Attack name</label>
          <input
            className={fieldClass}
            value={attackName}
            onChange={(e) => setAttackName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Payload</label>
          <textarea
            rows={4}
            className={fieldClass}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={defenseEnabled}
              onChange={(e) => setDefenseEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)]"
            />
            Enable Security Agent defense
          </label>
          <button
            type="button"
            onClick={() => void onSimulate()}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-xl bg-hospital-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hospital-700 disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Run simulation
          </button>
        </div>
      </section>

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-red-200 bg-red-50/80 p-5 shadow-sm dark:border-red-900 dark:bg-red-950/30">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-red-800 dark:text-red-100">
              <ShieldOff className="h-5 w-5" />
              Without protection
            </h3>
            <p className="mt-2 text-xs text-red-700/80 dark:text-red-200/80">
              Naive model follows injected instructions (demo only).
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase opacity-70">Followed injection</dt>
                <dd className="font-medium">
                  {String(without?.followed_injection ?? '—')}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase opacity-70">Suggested risk</dt>
                <dd className="font-medium capitalize">
                  {String(without?.suggested_risk_level ?? '—')}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase opacity-70">Actions</dt>
                <dd>
                  <ul className="mt-1 list-inside list-disc">
                    {((without?.actions as string[]) || []).map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-emerald-800 dark:text-emerald-100">
              <Shield className="h-5 w-5" />
              With protection
            </h3>
            <p className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-200/80">
              Security Agent: sanitize → validate → risk score → block if needed.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase opacity-70">Blocked</dt>
                <dd className="font-medium">
                  {String(result.comparison.blocked_by_defense)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase opacity-70">Risk score</dt>
                <dd className="font-medium">
                  {result.comparison.risk_score} / threshold {result.comparison.threshold}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase opacity-70">Message</dt>
                <dd>{String(withProt?.message ?? '—')}</dd>
              </div>
              {result.log.findings.length > 0 && (
                <div>
                  <dt className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase opacity-70">
                    <ShieldAlert className="h-3 w-3" /> Findings
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {result.log.findings.map((f, i) => (
                      <span
                        key={`${f.pattern}-${i}`}
                        className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs dark:bg-emerald-900/50"
                      >
                        {f.pattern} ({f.weight})
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </article>
        </div>
      )}
    </div>
  )
}
