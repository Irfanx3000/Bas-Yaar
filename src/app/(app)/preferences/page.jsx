"use client";

/* Preferences — the app's PreferencesScreen. Profile's "Edit" on Preferences has
 * always linked here; the route did not exist, so it 404'd.
 *
 * Pick the job categories you want to be alerted about. Categories come from the
 * admin-managed taxonomy, with the bundled list shown instantly until that
 * resolves (the app's fallback-then-live pattern); the selection is the user's
 * `preferredCategories`, read and written through the already-ported
 * preferencesService. Chips keyed and saved by category NAME, as the app does.
 *
 * On save the app pops back to Profile. The web has no stack to pop, so it
 * navigates there explicitly with a toast confirming what happened.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jobTaxonomyService } from "@/services/jobTaxonomy.service";
import { preferencesService } from "@/services/preferences.service";
import { CATEGORIES as FALLBACK_CATEGORIES } from "@/constants/categories.constants";
import { showToast } from "@/utils/toastRef";
import { t } from "@/i18n";
import { Button, Icon, InlineAlert, LoadingState } from "@/components/ui";

export default function PreferencesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [selected, setSelected] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([jobTaxonomyService.getCategories(), preferencesService.getPreferences()])
      .then(([rows, preferred]) => {
        if (cancelled) return;
        if (rows?.length) setCategories(rows);
        setSelected(preferred);
      })
      .catch(() => {
        if (!cancelled) setError(t("profile.preferencesScreen.loadError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (name) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      await preferencesService.updatePreferences(selected);
      showToast({ message: "Preferences saved", tone: "success", icon: "check" });
      router.push("/profile");
    } catch {
      setError(t("profile.preferencesScreen.saveError"));
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-[15px] pb-8 lg:px-6">
      <header className="pt-2 pb-4">
        <Link
          href="/profile"
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <Icon name="chevron-left" size={11} />
          Profile
        </Link>
        <h1 className="text-h2 font-extrabold text-heading">{t("profile.preferencesScreen.title")}</h1>
        <p className="mt-[2px] text-md text-body">{t("profile.preferencesScreen.subtitle")}</p>
      </header>

      {isLoading ? (
        <LoadingState rows={2} />
      ) : (
        <>
          {error ? (
            <InlineAlert tone="error" className="mb-3">
              {error}
            </InlineAlert>
          ) : null}

          <div className="flex flex-wrap gap-2" role="group" aria-label={t("profile.preferencesScreen.title")}>
            {categories.map((item) => {
              const isSelected = selected.includes(item.name);
              return (
                <button
                  key={item.name}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(item.name)}
                  className={`flex cursor-pointer items-center gap-2 rounded-pill border px-5 py-2.5 text-md transition-colors duration-[180ms] ease-standard ${
                    isSelected
                      ? "border-primary bg-primary-light font-medium text-heading"
                      : "border-line-input bg-surface text-body hover:text-heading"
                  }`}
                >
                  {isSelected ? <Icon name="check" size={12} /> : null}
                  {item.labelKey ? t(item.labelKey) : item.name}
                </button>
              );
            })}
          </div>

          <Button className="mt-6" onClick={handleSave} loading={isSaving} icon="check">
            {t("profile.preferencesScreen.save")}
          </Button>
        </>
      )}
    </div>
  );
}
