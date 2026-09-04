"use client";

/* Create account — the app's five-step flow, step for step.
 *
 * An earlier version collapsed steps 1–3 into one page on the argument that a
 * browser can show all three at once. That was the wrong call: the steps are how
 * this product asks for an account, the mobile app and the web should not diverge
 * on something a user is walked through, and a single 12-field form is a wall
 * where five short screens are a conversation. Reverted to match the app.
 *
 * What the web DOES change is the frame, not the flow: one route holds all five
 * steps rather than five routes. The steps share a large amount of state, and
 * step 4 turns anonymous into authenticated mid-flow — passing that between
 * routes would mean either query strings carrying half a registration or a
 * store that exists for one funnel. Browser Back is mapped onto step-back so it
 * still behaves the way people expect.
 *
 *   1  Tell Us About Yourself   name · DOB · gender
 *   2  Where are you located?   nationality · country · state · city
 *   3  Let's Stay Connected     phone · email · password       → register()
 *   4  Verify Your Number       6-digit OTP                    → session created
 *   5  Your Maritime Profile    department · rank · designation · experience
 *      All Set                  explore jobs / complete profile
 *
 * Payload verified field-by-field against the backend's auth.validation.js.
 * Required fields carry a red asterisk; state, city, referral and every field in
 * step 5 are genuinely optional server-side, so they do not.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";
import { useJobTaxonomyOptions } from "@/hooks/useJobTaxonomyOptions";
import { getRankOptions, DESIGNATIONS } from "@/constants/maritime.constants";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { COUNTRY_OPTIONS, getStateOptions } from "@/utils/geo.utils";
import { Button, Card, DatePicker, Icon, InlineAlert, Input, Select } from "@/components/ui";

const TOTAL_STEPS = 5;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const GENDERS = [
  { value: "Male", icon: "mars" },
  { value: "Female", icon: "venus" },
  { value: "Others", icon: "genderless" },
];

/* The API wants country NAMES; the dataset is keyed by ISO code, and states are
   looked up by that code. So the code lives in state and is mapped to a name
   only at submit — the trap that would otherwise send "IN" as a country. */
const countryByCode = (code) => COUNTRY_OPTIONS.find((c) => c.value === code);

/* Local date parts, never toISOString() — that returns UTC, so "today" flips a
   day either side of midnight depending on the timezone. */
const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function SignupPage() {
  const router = useRouter();
  const { departmentOptions } = useJobTaxonomyOptions();

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    countryCode: "",
    stateCode: "",
    city: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    otp: "",
    department: "",
    rank: "",
    designation: "",
    experienceStartDate: "",
    experienceEndDate: "",
  });

  const set = (key) => (value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value?.target ? value.target.value : value,
      ...(key === "countryCode" ? { stateCode: "", city: "" } : null),
      ...(key === "department" ? { rank: "" } : null),
    }));

  const stateOptions = useMemo(
    () => (form.countryCode ? getStateOptions(form.countryCode) : []),
    [form.countryCode],
  );
  const rankOptions = useMemo(
    () => (form.department ? getRankOptions(form.department) : []),
    [form.department],
  );
  const dial = countryByCode(form.countryCode)?.dialCode ?? "";

  /* Per-step gating. The Next button is disabled rather than validating on
     click: the user can see what is missing from the asterisks, and a button
     that looks pressable but refuses is worse than one that plainly is not. */
  const canContinue = {
    1: form.name.trim().length >= 2 && form.dateOfBirth && form.gender,
    2: !!form.nationality && !!form.countryCode,
    3:
      form.phone.replace(/\D/g, "").length >= 7 &&
      form.email.includes("@") &&
      form.password.length >= 8 &&
      form.password === form.confirmPassword,
    4: form.otp.length === OTP_LENGTH,
    5: true,
  }[step];

  const back = () => {
    setError(null);
    // Step 4 onwards is past the point of no return — the account exists.
    if (step <= 1 || step >= 4) return;
    setStep((n) => n - 1);
  };

  const startCooldown = () => {
    setCooldown(RESEND_SECONDS);
    const tick = setInterval(() => {
      setCooldown((n) => {
        if (n <= 1) {
          clearInterval(tick);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  /* Step 3 → register, which sends the OTP. No session yet. */
  const submitRegistration = async () => {
    setBusy(true);
    setError(null);
    try {
      await authService.register({
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        nationality: form.nationality,
        country: countryByCode(form.countryCode)?.label ?? "",
        state: stateOptions.find((s) => s.value === form.stateCode)?.label || undefined,
        city: form.city || undefined,
        phone: `+${dial}${form.phone.replace(/\D/g, "")}`,
        email: form.email.trim(),
        password: form.password,
        referralCode: form.referralCode.trim() || undefined,
      });
      setStep(4);
      startCooldown();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  /* Step 4 → verify, which stores tokens. Authenticated from here. */
  const submitOtp = async () => {
    setBusy(true);
    setError(null);
    try {
      await authService.verifyOTP(form.email.trim(), form.otp);
      setStep(5);
    } catch (err) {
      setError(getErrorMessage(err));
      setForm((p) => ({ ...p, otp: "" }));
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setError(null);
    setNotice(null);
    try {
      await authService.sendOTP(form.email.trim());
      setNotice("We've sent a new code.");
      startCooldown();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  /* Step 5 → optional. Every field can be empty, and the app's own screen
     navigates on regardless of whether the save succeeded — losing an optional
     profile field must never strand someone outside the app they just created. */
  const submitMaritime = async () => {
    const payload = {};
    if (form.department) payload.department = form.department;
    if (form.rank) payload.rank = form.rank;
    if (form.designation) payload.designation = form.designation;
    if (form.experienceStartDate) payload.experienceStartDate = form.experienceStartDate;
    if (form.experienceEndDate) payload.experienceEndDate = form.experienceEndDate;

    if (Object.keys(payload).length === 0) {
      setDone(true);
      return;
    }

    setBusy(true);
    try {
      await profileService.updateMaritimeProfile(payload);
    } catch {
      /* Deliberately swallowed — see above. It is saveable later from /profile. */
    } finally {
      setBusy(false);
      setDone(true);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!canContinue) return;
    if (step === 3) return submitRegistration();
    if (step === 4) return submitOtp();
    if (step === 5) return submitMaritime();
    setStep((n) => n + 1);
  };

  if (done) return <AllSet router={router} />;

  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center px-[15px] py-8">
      <Backdrop />

      <Card className="w-full max-w-md" elevation="md" radius="lg">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step <= 1 || step >= 4}
            aria-label="Back"
            className="cursor-pointer rounded-round p-2 text-hint hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Icon name="chevron-left" size={14} />
          </button>
          <div className="flex-1">
            <p className="text-center text-sm font-medium text-body">
              Step {step} of {TOTAL_STEPS}
            </p>
            <div
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-label={`Step ${step} of ${TOTAL_STEPS}`}
              className="mt-2 h-1.5 w-full overflow-hidden rounded-round bg-primary-tint"
            >
              <div
                className="bg-gradient-primary h-full rounded-round transition-[width] duration-[280ms] ease-decelerate"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
          <span className="w-9" aria-hidden="true" />
        </div>

        <form onSubmit={onSubmit}>
          {step === 1 ? <StepOne form={form} set={set} /> : null}
          {step === 2 ? <StepTwo form={form} set={set} stateOptions={stateOptions} /> : null}
          {step === 3 ? <StepThree form={form} set={set} dial={dial} /> : null}
          {step === 4 ? (
            <StepFour
              form={form}
              set={set}
              dial={dial}
              cooldown={cooldown}
              onResend={resendOtp}
              onEdit={() => setStep(3)}
            />
          ) : null}
          {step === 5 ? (
            <StepFive
              form={form}
              set={set}
              departmentOptions={departmentOptions}
              rankOptions={rankOptions}
            />
          ) : null}

          {error ? (
            <InlineAlert tone="error" className="mb-3">
              {error}
            </InlineAlert>
          ) : null}
          {notice ? (
            <InlineAlert tone="success" className="mb-3">
              {notice}
            </InlineAlert>
          ) : null}

          <Button type="submit" fullWidth loading={busy} disabled={!canContinue}>
            {step === 3
              ? "Send Verification Code"
              : step === 4
                ? "Verify"
                : step === 5
                  ? "Next"
                  : "Next"}
            {step < 3 || step === 5 ? <Icon name="arrow-right" size={12} /> : null}
          </Button>

          {step === 5 ? (
            <button
              type="button"
              onClick={() => setDone(true)}
              className="mt-2 w-full cursor-pointer py-2 text-md font-semibold text-body hover:text-heading"
            >
              Skip
            </button>
          ) : null}
        </form>

        {step < 4 ? (
          <p className="mt-4 text-center text-md text-body">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
        ) : null}
      </Card>
    </main>
  );
}

/* The app puts every auth screen on a sea photograph. Reused here so signup
   feels like the same product, dimmed enough that the card stays the subject. */
function Backdrop() {
  return (
    <>
      <Image src="/hero-job.png" alt="" fill priority className="-z-10 object-cover" />
      <div className="absolute inset-0 -z-10 bg-canvas-top/80" />
    </>
  );
}

function StepHeading({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h1 className="text-h3 font-extrabold text-heading">{title}</h1>
      <p className="mt-[2px] text-sm text-body">{subtitle}</p>
    </div>
  );
}

function StepOne({ form, set }) {
  return (
    <>
      <StepHeading title="Tell Us About Yourself" subtitle="Let's start with some basic information." />

      <Input
        label="Full Name"
        required
        minLength={2}
        maxLength={50}
        autoFocus
        value={form.name}
        onChange={set("name")}
        placeholder="Enter full name"
      />

      {/* yearsBack=80 so the year dropdown actually reaches a plausible date of
          birth. `max` is built from local date parts, not toISOString(), which
          is UTC and would let someone born today be rejected — or accepted —
          depending on their timezone. */}
      <DatePicker
        label="Date of Birth"
        required
        max={todayISO()}
        yearsBack={80}
        yearsForward={0}
        value={form.dateOfBirth}
        onChange={set("dateOfBirth")}
      />

      <fieldset className="mb-3">
        <legend className="mb-[5px] block text-sm font-medium text-body">
          Gender
          <span className="ml-[2px] text-danger" aria-hidden="true">*</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((g) => {
            const active = form.gender === g.value;
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={active}
                onClick={() => set("gender")(g.value)}
                className={`flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[12px] border text-md font-semibold transition-colors duration-[180ms] ease-standard ${
                  active
                    ? "border-primary bg-primary text-on-primary"
                    : "border-line-input bg-surface text-body hover:border-primary"
                }`}
              >
                <Icon name={g.icon} size={13} />
                {g.value}
              </button>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}

function StepTwo({ form, set, stateOptions }) {
  return (
    <>
      <StepHeading title="Where are you located?" subtitle="This helps us match you to the right vacancies." />

      <Select
        label="Nationality"
        required
        placeholder="Select your nationality"
        options={COUNTRY_OPTIONS.map((c) => ({ value: c.label, label: `${c.flag} ${c.label}` }))}
        value={form.nationality}
        onChange={set("nationality")}
      />

      <Select
        label="Country"
        required
        placeholder="Select your Country"
        options={COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: `${c.flag} ${c.label}` }))}
        value={form.countryCode}
        onChange={set("countryCode")}
      />

      {/* State and city are optional server-side — some countries have no
          subdivisions in the dataset — so neither carries an asterisk. */}
      <Select
        label="State / Province"
        placeholder={form.countryCode ? "Select your state" : "Choose a country first"}
        options={stateOptions}
        value={form.stateCode}
        onChange={set("stateCode")}
        disabled={!stateOptions.length}
      />

      <Input
        label="City"
        value={form.city}
        onChange={set("city")}
        placeholder="Select your city"
      />
    </>
  );
}

function StepThree({ form, set, dial }) {
  const [showPassword, setShowPassword] = useState(false);
  const mismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <>
      <StepHeading title="Let's Stay Connected" subtitle="We'll use these to verify your account." />

      <div className="mb-3">
        <label htmlFor="phone" className="mb-[5px] block text-sm font-medium text-body">
          Mobile Number
          <span className="ml-[2px] text-danger" aria-hidden="true">*</span>
        </label>
        <div className="flex gap-2">
          <span className="flex min-h-[50px] shrink-0 items-center rounded-[12px] border border-line-input bg-canvas px-3 text-md font-semibold text-body">
            {countryByCode(form.countryCode)?.flag} {dial ? `+${dial}` : "+—"}
          </span>
          <Input
            id="phone"
            type="tel"
            required
            inputMode="numeric"
            containerClassName="mb-0 flex-1"
            value={form.phone}
            onChange={set("phone")}
            placeholder="Enter your phone number"
          />
        </div>
      </div>

      <Input
        label="Email Address"
        type="email"
        required
        autoComplete="email"
        value={form.email}
        onChange={set("email")}
        placeholder="Enter your email address"
        hint="Your verification code goes here."
      />

      <Input
        label="Set Password"
        type={showPassword ? "text" : "password"}
        required
        minLength={8}
        autoComplete="new-password"
        iconRight={showPassword ? "eye-slash" : "eye"}
        value={form.password}
        onChange={set("password")}
        placeholder="Set Password"
        hint="At least 8 characters."
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        className="-mt-2 mb-3 cursor-pointer text-sm font-semibold text-primary hover:underline"
      >
        {showPassword ? "Hide" : "Show"} password
      </button>

      <Input
        label="Confirm Password"
        type={showPassword ? "text" : "password"}
        required
        autoComplete="new-password"
        value={form.confirmPassword}
        onChange={set("confirmPassword")}
        placeholder="Re-enter Password"
        error={mismatch ? "Those passwords do not match." : undefined}
      />

      <Input
        label="Referral Code"
        maxLength={20}
        value={form.referralCode}
        onChange={set("referralCode")}
        placeholder="Optional"
      />
    </>
  );
}

/* Six boxes, as the app draws them — but paste and autofill still work.
   `one-time-code` sits on the first box so a browser can fill it, and a paste
   anywhere distributes across all six. Without that, six inputs would be a
   downgrade on the single field they replace. */
function StepFour({ form, set, dial, cooldown, onResend, onEdit }) {
  const digits = form.otp.padEnd(OTP_LENGTH, " ").split("").slice(0, OTP_LENGTH);

  const focusBox = (index) =>
    document.getElementById(`otp-${index}`)?.focus();

  const setDigit = (index, char) => {
    const next = form.otp.padEnd(OTP_LENGTH, " ").split("");
    next[index] = char || " ";
    const joined = next.join("").replace(/\s+$/, "");
    set("otp")(joined.trimEnd());
    if (char && index < OTP_LENGTH - 1) focusBox(index + 1);
  };

  return (
    <>
      <StepHeading title="Verify Your Number" subtitle={`Enter the ${OTP_LENGTH} digit code we emailed you.`} />

      <div className="mb-4 flex items-center justify-between gap-2 rounded-[12px] border border-line-input bg-canvas px-3 py-2">
        <span className="truncate text-md text-heading">
          {countryByCode(form.countryCode)?.flag} +{dial} {form.phone}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 cursor-pointer text-sm font-semibold text-primary hover:underline"
        >
          Edit
        </button>
      </div>

      <div className="mb-4 flex justify-between gap-2" onPaste={(e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (pasted) set("otp")(pasted);
      }}>
        {digits.map((digit, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            inputMode="numeric"
            maxLength={1}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={i === 0}
            aria-label={`Digit ${i + 1}`}
            value={digit.trim()}
            onChange={(e) => setDigit(i, e.target.value.replace(/\D/g, "").slice(-1))}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digit.trim() && i > 0) focusBox(i - 1);
            }}
            className="min-h-[52px] w-full rounded-[12px] border border-line-input bg-surface text-center text-xl font-bold text-heading outline-none focus:border-primary focus-visible:outline-none"
          />
        ))}
      </div>

      <p className="mb-3 text-center text-sm text-body">
        Didn&apos;t receive OTP?{" "}
        {cooldown > 0 ? (
          <span className="text-hint">Resend in {cooldown}s</span>
        ) : (
          <button type="button" onClick={onResend} className="cursor-pointer font-semibold text-primary hover:underline">
            Resend OTP
          </button>
        )}
      </p>
    </>
  );
}

function StepFive({ form, set, departmentOptions, rankOptions }) {
  return (
    <>
      <StepHeading title="Your Maritime Profile" subtitle="Tell us about your professional background." />

      {/* Nothing here is required — the app lets this whole step be skipped, and
          the server accepts an empty payload. So no asterisks. */}
      <Select
        label="Department"
        placeholder="Select your department"
        options={departmentOptions}
        value={form.department}
        onChange={set("department")}
      />

      <Select
        label="Rank"
        placeholder={form.department ? "Select your rank" : "Choose a department first"}
        options={rankOptions}
        value={form.rank}
        onChange={set("rank")}
        disabled={!rankOptions.length}
      />

      <Select
        label="Designation"
        placeholder="Select your designation"
        options={DESIGNATIONS}
        value={form.designation}
        onChange={set("designation")}
      />

      <fieldset>
        <legend className="mb-[5px] block text-sm font-medium text-body">Experience</legend>
        <div className="grid grid-cols-2 gap-2">
          {/* A sea career, not a lifetime — 60 back is generous and keeps the
              year list short enough to scan. */}
          <DatePicker
            label="Start Date"
            placeholder="Start Date"
            yearsBack={60}
            yearsForward={0}
            max={todayISO()}
            value={form.experienceStartDate}
            onChange={set("experienceStartDate")}
          />
          <DatePicker
            label="End Date"
            placeholder="End Date"
            yearsBack={60}
            yearsForward={0}
            min={form.experienceStartDate || undefined}
            value={form.experienceEndDate}
            onChange={set("experienceEndDate")}
          />
        </div>
      </fieldset>
    </>
  );
}

function AllSet({ router }) {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center px-[15px] py-8">
      <Backdrop />
      <Card className="w-full max-w-md text-center" elevation="md" radius="lg">
        <span className="mx-auto flex size-16 items-center justify-center rounded-round bg-success-light text-success">
          <Icon name="check-circle" size={30} />
        </span>

        <h1 className="mt-4 text-h2 font-extrabold text-primary-vivid">You&apos;re All Set!</h1>
        <p className="mt-1 text-md text-body">
          Start exploring jobs and apply to your dream role.
        </p>

        <div className="mt-6 space-y-2">
          <Button fullWidth icon="arrow-right" iconPosition="right" onClick={() => router.replace("/jobs")}>
            Explore Jobs
          </Button>
          <Button fullWidth variant="outline" onClick={() => router.replace("/profile")}>
            Complete Profile
          </Button>
        </div>
      </Card>
    </main>
  );
}
