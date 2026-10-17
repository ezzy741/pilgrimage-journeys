import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CarFront,
  Check,
  LoaderCircle,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n, type Lang } from "@/lib/i18n";

type ServiceZone = "makkah" | "madinah";
type VehicleType = "sedan" | "suv" | "hiace";
type RegistrationPayload = {
  fullName: string;
  phone: string;
  serviceZones: ServiceZone[];
  vehicleType: VehicleType;
  vehicleModel: string;
  consent: true;
};
type Receipt = { id: string; reference: string; status: "pending_review" };
type Copy = {
  eyebrow: string;
  title: string;
  intro: string;
  cardTitle: string;
  cardIntro: string;
  name: string;
  phone: string;
  zones: string;
  makkah: string;
  madinah: string;
  vehicleType: string;
  sedan: string;
  suv: string;
  hiace: string;
  vehicleModel: string;
  consent: string;
  submit: string;
  submitting: string;
  privacy: string;
  home: string;
  requiredZones: string;
  invalid: string;
  tooMany: string;
  unavailable: string;
  retry: string;
  successTitle: string;
  reference: string;
  pending: string;
  successClarification: string;
  again: string;
  received: string;
  noId: string;
  modelHint: string;
  status: string;
};

const copy: Record<Lang, Copy> = {
  en: {
    eyebrow: "Drive with Visit Hijaz",
    title: "Make the journey memorable.",
    intro:
      "Tell us a little about you and your vehicle. Our team will review your request and contact you.",
    cardTitle: "Driver registration",
    cardIntro: "A few details to begin. No payment is required.",
    name: "Full name",
    phone: "Phone / WhatsApp",
    zones: "Where can you serve?",
    makkah: "Makkah",
    madinah: "Madinah",
    vehicleType: "Vehicle type",
    sedan: "Sedan",
    suv: "SUV",
    hiace: "Hiace / van",
    vehicleModel: "Vehicle model",
    consent:
      "I agree that Visit Hijaz may store these details to review my driver registration and contact me about it.",
    submit: "Send registration",
    submitting: "Sending request…",
    privacy:
      "We only ask for the details needed to review your interest. Never send identity documents, vehicle plate, or bank details.",
    home: "Visit the main website",
    requiredZones: "Choose at least one service area.",
    invalid: "Some details need attention. Check the fields and try again.",
    tooMany: "Too many requests. Please wait a moment, then try again.",
    unavailable: "Registration is temporarily unavailable. Please try again shortly.",
    retry:
      "We could not confirm receipt. You can retry with the same details; this helps prevent duplicate requests.",
    successTitle: "Request received",
    reference: "Your reference",
    pending: "Pending review",
    successClarification:
      "Your registration has been received and is pending review. This is not an approval, driver account, or guarantee of rides. We will contact you if we need to continue. No payment has been taken.",
    again: "Start a new registration",
    received: "Received",
    noId: "No identity documents or payment details are requested.",
    modelHint: "For example: Toyota Camry 2022",
    status: "Request status",
  },
  ar: {
    eyebrow: "اعمل سائقًا مع Visit Hijaz",
    title: "اجعل الرحلة لا تُنسى.",
    intro: "أخبرنا بالقليل عنك وعن مركبتك. سيراجع فريقنا طلبك ويتواصل معك.",
    cardTitle: "تسجيل السائق",
    cardIntro: "بعض التفاصيل للبدء. لا يلزم دفع أي مبلغ.",
    name: "الاسم الكامل",
    phone: "الهاتف / واتساب",
    zones: "أين يمكنك العمل؟",
    makkah: "مكة المكرمة",
    madinah: "المدينة المنورة",
    vehicleType: "نوع المركبة",
    sedan: "سيدان",
    suv: "دفع رباعي",
    hiace: "هايس / فان",
    vehicleModel: "طراز المركبة",
    consent: "أوافق على أن تحتفظ Visit Hijaz بهذه التفاصيل لمراجعة تسجيلي والتواصل معي بشأنه.",
    submit: "إرسال التسجيل",
    submitting: "جارٍ إرسال الطلب…",
    privacy:
      "نطلب فقط التفاصيل اللازمة لمراجعة رغبتك. لا ترسل وثائق هوية أو رقم لوحة أو بيانات مصرفية.",
    home: "زيارة الموقع الرئيسي",
    requiredZones: "اختر منطقة خدمة واحدة على الأقل.",
    invalid: "يرجى مراجعة بعض البيانات والمحاولة مرة أخرى.",
    tooMany: "طلبات كثيرة. انتظر قليلًا ثم حاول مجددًا.",
    unavailable: "التسجيل غير متاح مؤقتًا. حاول مرة أخرى بعد قليل.",
    retry: "تعذر تأكيد استلام طلبك. يمكنك إعادة المحاولة بالتفاصيل نفسها لتجنب التكرار.",
    successTitle: "تم استلام الطلب",
    reference: "رقم المرجع",
    pending: "بانتظار المراجعة",
    successClarification:
      "تم استلام تسجيلك وهو بانتظار المراجعة. هذا لا يعني الموافقة أو إنشاء حساب سائق أو ضمان الحصول على رحلات. سنتواصل معك إذا قررنا المتابعة. لم يتم تحصيل أي مبلغ.",
    again: "بدء تسجيل جديد",
    received: "تم الاستلام",
    noId: "لا نطلب وثائق هوية أو بيانات دفع.",
    modelHint: "مثال: تويوتا كامري 2022",
    status: "حالة الطلب",
  },
  ur: {
    eyebrow: "Visit Hijaz کے ساتھ ڈرائیو کریں",
    title: "سفر کو یادگار بنائیں۔",
    intro:
      "اپنے اور اپنی گاڑی کے بارے میں تھوڑی معلومات دیں۔ ہماری ٹیم درخواست کا جائزہ لے کر آپ سے رابطہ کرے گی۔",
    cardTitle: "ڈرائیور رجسٹریشن",
    cardIntro: "آغاز کے لیے چند تفصیلات۔ کوئی ادائیگی درکار نہیں۔",
    name: "پورا نام",
    phone: "فون / واٹس ایپ",
    zones: "آپ کہاں خدمات دے سکتے ہیں؟",
    makkah: "مکہ",
    madinah: "مدینہ",
    vehicleType: "گاڑی کی قسم",
    sedan: "سیڈان",
    suv: "ایس یو وی",
    hiace: "ہائی ایس / وین",
    vehicleModel: "گاڑی کا ماڈل",
    consent:
      "میں Visit Hijaz کو ڈرائیور رجسٹریشن کا جائزہ لینے اور رابطے کے لیے یہ تفصیلات محفوظ کرنے کی اجازت دیتا/دیتی ہوں۔",
    submit: "رجسٹریشن بھیجیں",
    submitting: "درخواست بھیجی جا رہی ہے…",
    privacy:
      "ہم صرف دلچسپی کا جائزہ لینے کے لیے ضروری تفصیلات لیتے ہیں۔ شناختی دستاویز، گاڑی کی پلیٹ یا بینک کی معلومات نہ بھیجیں۔",
    home: "مرکزی ویب سائٹ دیکھیں",
    requiredZones: "کم از کم ایک سروس ایریا منتخب کریں۔",
    invalid: "کچھ تفصیلات درست کریں اور دوبارہ کوشش کریں۔",
    tooMany: "بہت زیادہ درخواستیں۔ کچھ دیر انتظار کرکے دوبارہ کوشش کریں۔",
    unavailable: "رجسٹریشن عارضی طور پر دستیاب نہیں۔ کچھ دیر بعد کوشش کریں۔",
    retry:
      "درخواست موصول ہونے کی تصدیق نہیں ہو سکی۔ نقل سے بچنے کے لیے انہی تفصیلات کے ساتھ دوبارہ کوشش کریں۔",
    successTitle: "درخواست موصول ہو گئی",
    reference: "آپ کا حوالہ",
    pending: "جائزے کے انتظار میں",
    successClarification:
      "آپ کی رجسٹریشن موصول ہو گئی ہے اور جائزے کے انتظار میں ہے۔ یہ منظوری، ڈرائیور اکاؤنٹ یا سواریوں کی ضمانت نہیں ہے۔ آگے بڑھنے پر ہم رابطہ کریں گے۔ کوئی ادائیگی نہیں لی گئی۔",
    again: "نئی رجسٹریشن شروع کریں",
    received: "موصول",
    noId: "شناختی دستاویز یا ادائیگی کی معلومات درکار نہیں۔",
    modelHint: "مثال: ٹویوٹا کیمری 2022",
    status: "درخواست کی حالت",
  },
};

const API_URL = "/api/driver-registrations";

function friendlyError(status: number | undefined, text: Copy) {
  if (status === 400 || status === 422) return text.invalid;
  if (status === 429) return text.tooMany;
  if (status === 503) return text.unavailable;
  return text.retry;
}

export function DriverRegistration() {
  const { lang, dir } = useI18n();
  const t = copy[lang];
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceZones, setServiceZones] = useState<ServiceZone[]>([]);
  const [vehicleType, setVehicleType] = useState<VehicleType>("sedan");
  const [vehicleModel, setVehicleModel] = useState("");
  const [consent, setConsent] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const busyRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const idempotencyRef = useRef<{ canonical: string; key: string } | null>(null);
  const zoneErrorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const toggleZone = (zone: ServiceZone) => {
    setServiceZones((current) =>
      current.includes(zone) ? current.filter((item) => item !== zone) : [...current, zone],
    );
  };

  const startNew = () => {
    setReceipt(null);
    setFullName("");
    setPhone("");
    setServiceZones([]);
    setVehicleType("sedan");
    setVehicleModel("");
    setConsent(false);
    setError("");
    idempotencyRef.current = null;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busyRef.current) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!serviceZones.length) {
      setError(t.requiredZones);
      zoneErrorRef.current?.focus();
      return;
    }
    const payload: RegistrationPayload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      serviceZones: [...serviceZones].sort(),
      vehicleType,
      vehicleModel: vehicleModel.trim(),
      consent: true,
    };
    if (payload.fullName.length < 2 || payload.vehicleModel.length < 2) {
      setError(t.invalid);
      return;
    }
    const canonical = JSON.stringify(payload);
    const priorAttempt = idempotencyRef.current;
    const idempotencyKey =
      priorAttempt?.canonical === canonical ? priorAttempt.key : crypto.randomUUID();
    if (priorAttempt?.canonical !== canonical)
      idempotencyRef.current = { canonical, key: idempotencyKey };
    busyRef.current = true;
    setBusy(true);
    setError("");
    const controller = new AbortController();
    controllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey, ...payload }),
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) {
        setError(friendlyError(response.status, t));
        return;
      }
      const body: unknown = await response.json();
      const candidate = (body as { receipt?: unknown } | null)?.receipt;
      if (!candidate || typeof candidate !== "object") {
        setError(t.retry);
        return;
      }
      const parsed = candidate as Partial<Receipt>;
      if (
        typeof parsed.id !== "string" ||
        typeof parsed.reference !== "string" ||
        parsed.status !== "pending_review"
      ) {
        setError(t.retry);
        return;
      }
      setReceipt({ id: parsed.id, reference: parsed.reference, status: "pending_review" });
      setFullName("");
      setPhone("");
      setServiceZones([]);
      setVehicleModel("");
      setConsent(false);
      idempotencyRef.current = null;
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") setError(t.retry);
      else setError(t.retry);
    } finally {
      window.clearTimeout(timeout);
      if (controllerRef.current === controller) controllerRef.current = null;
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <main
      dir={dir}
      lang={lang}
      className="min-h-[calc(100vh-4rem)] bg-background px-4 py-8 sm:py-14"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <section className="pt-2 lg:sticky lg:top-10">
          <a
            href="https://visit-hijaz.com"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            {t.home}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
          <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t.eyebrow}
          </p>
          <h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">{t.intro}</p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <MapPinned className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">
                {t.makkah} · {t.madinah}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t.zones}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">{t.pending}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.noId}</p>
            </div>
          </div>
        </section>

        <Card className="overflow-hidden rounded-3xl border-border shadow-card">
          <div className="h-2 gradient-holy" />
          <CardContent className="p-5 sm:p-8">
            {receipt ? (
              <section aria-live="polite">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <BadgeCheck className="size-7" aria-hidden="true" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-bold">{t.successTitle}</h2>
                <div className="mt-5 rounded-2xl border border-border bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">{t.reference}</p>
                  <p className="mt-1 break-all font-mono text-lg font-bold">{receipt.reference}</p>
                  <p className="mt-4 text-xs text-muted-foreground">{t.status}</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold">
                    <Check className="size-4" />
                    {t.pending}
                  </p>
                </div>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">
                  {t.successClarification}
                </p>
                <Button type="button" className="mt-7 w-full" onClick={startNew}>
                  {t.again}
                </Button>
              </section>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <CarFront className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold">{t.cardTitle}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t.cardIntro}</p>
                  </div>
                </div>
                <form className="mt-7 space-y-5" onSubmit={submit} noValidate={false}>
                  <div className="space-y-2">
                    <Label htmlFor="driver-name">{t.name}</Label>
                    <Input
                      id="driver-name"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={100}
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver-phone">{t.phone}</Label>
                    <Input
                      id="driver-phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      minLength={7}
                      maxLength={24}
                      pattern="[+0-9() .-]+"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">
                      {t.zones} <span aria-hidden="true">*</span>
                    </legend>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ["makkah", t.makkah],
                          ["madinah", t.madinah],
                        ] as const
                      ).map(([zone, label]) => (
                        <label
                          key={zone}
                          className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3 text-sm hover:bg-secondary/60"
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={serviceZones.includes(zone)}
                            onChange={() => toggleZone(zone)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <p
                      ref={zoneErrorRef}
                      tabIndex={-1}
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {error === t.requiredZones ? error : ""}
                    </p>
                  </fieldset>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle-type">{t.vehicleType}</Label>
                    <select
                      id="vehicle-type"
                      required
                      value={vehicleType}
                      onChange={(event) => setVehicleType(event.target.value as VehicleType)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="sedan">{t.sedan}</option>
                      <option value="suv">{t.suv}</option>
                      <option value="hiace">{t.hiace}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle-model">{t.vehicleModel}</Label>
                    <Input
                      id="vehicle-model"
                      required
                      minLength={2}
                      maxLength={60}
                      placeholder={t.modelHint}
                      value={vehicleModel}
                      onChange={(event) => setVehicleModel(event.target.value)}
                    />
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm leading-5">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                      required
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                    />
                    <span>{t.consent}</span>
                  </label>
                  {error && error !== t.requiredZones && (
                    <p
                      role="alert"
                      className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? (
                      <LoaderCircle className="me-2 size-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    {busy ? t.submitting : t.submit}
                  </Button>
                  <p className="text-center text-xs leading-5 text-muted-foreground">{t.privacy}</p>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
