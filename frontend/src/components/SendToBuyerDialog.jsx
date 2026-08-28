import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { Disclaimer } from "@/components/Common";
import { Mail, Send, Paperclip, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function SendToBuyerDialog({ deal, open, onOpenChange, onSent }) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");
  const [form, setForm] = useState({ recipient: "", subject: "", message: "", attachments: [] });

  useEffect(() => {
    if (open) {
      setSent(false); setLoading(true);
      api.composeEmail(deal.id)
        .then((d) => setForm({ recipient: d.recipient, subject: d.subject, message: d.message, attachments: d.attachments }))
        .catch(() => toast.error("Could not compose email"))
        .finally(() => setLoading(false));
    }
  }, [open, deal.id]);

  const send = async () => {
    setSending(true);
    try {
      const res = await api.sendToBuyer(deal.id, { deal_id: deal.id, recipient: form.recipient, subject: form.subject, message: form.message });
      setNote(res.note || "");
      setSent(true);
      onSent?.();
    } catch { toast.error("Failed to send"); } finally { setSending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="send-buyer-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Mail size={18} className="text-indigo-600" /> Send to Buyer
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="py-10 text-center" data-testid="send-success">
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-emerald-600" size={32} />
            </div>
            <div className="font-display text-xl font-bold text-slate-900">Export pack sent successfully</div>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{note}</p>
            <button onClick={() => onOpenChange(false)} className="mt-6 bg-slate-900 text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors" data-testid="send-done-btn">Done</button>
          </div>
        ) : loading ? (
          <div className="space-y-3 py-4">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg shimmer" />)}</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="overline block mb-1.5">Recipient</label>
              <input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} data-testid="send-recipient" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="overline block mb-1.5">Subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="send-subject" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="overline block mb-1.5">Message</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={7} data-testid="send-message" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="overline block mb-2">Attachments</label>
              <div className="flex flex-wrap gap-2">
                {form.attachments.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-3 py-1"><Paperclip size={11} /> {a}</span>
                ))}
              </div>
            </div>
            <Disclaimer text="AI-generated draft — verify before sending." />
            <button onClick={send} disabled={sending} data-testid="send-documents-btn" className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-70">
              {sending ? <><Loader2 className="animate-spin" size={16} /> Sending…</> : <><Send size={16} /> Send Documents</>}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
