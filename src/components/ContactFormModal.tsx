import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactSchema, type ContactFormValues } from "../utils/contactSchema";

const CONTACT_EMAIL = "rheddi02@gmail.com";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ContactFormModal({ isOpen, onClose }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: "",
      subject: "",
      message: "",
    },
  });

  const submit = async (data: ContactFormValues) => {
    const body = `From: ${data.email}\r\n\r\n${data.message}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
    reset();
    onClose();
    toast.info("Opening your email app…");
  };

  const close = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-3xl bg-card p-4 shadow-lg sm:max-w-md sm:rounded-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Send us a message — opens in your email app
            </p>
          </div>
          <button
            onClick={close}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Your Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-base text-foreground outline-none transition focus:border-ring"
            />
            {errors.email && (
              <p className="text-sm text-rose-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Subject
            </label>
            <input
              type="text"
              placeholder="What's this about?"
              {...register("subject")}
              className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-base text-foreground outline-none transition focus:border-ring"
            />
            {errors.subject && (
              <p className="text-sm text-rose-500">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Message
            </label>
            <textarea
              rows={4}
              placeholder="How can we help?"
              {...register("message")}
              className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-base text-foreground outline-none transition focus:border-ring"
            />
            {errors.message && (
              <p className="text-sm text-rose-500">{errors.message.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
