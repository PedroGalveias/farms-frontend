"use client";

import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { ChevronDown, LoaderCircle, Plus, X } from "lucide-react";
import {
  EMPTY_FARM_FORM_VALUES,
  toCreateFarmInput,
  validateFarmForm,
} from "@/lib/farm-form";
import {
  KNOWN_CATEGORY_KEYS,
  categoryEmoji,
  categoryLabel,
} from "@/lib/categories";
import { PRODUCTS_BY_GROUP, productLabel } from "@/lib/products";
import { SWISS_CANTONS } from "@/lib/farms";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { FarmFormErrors, FarmFormValues } from "@/types/farm";

interface CreateFarmDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-transparent bg-tone px-4 py-3 text-sm font-medium text-ink transition duration-300 placeholder:font-normal placeholder:text-ink/70 focus:border-pine/50 focus:bg-cloud focus:ring-4 focus:ring-pine/10";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-ink/60";

export default function CreateFarmDialog({
  open,
  onClose,
  onSuccess,
}: CreateFarmDialogProps) {
  const { locale, t } = useLanguage();
  const [values, setValues] = useState<FarmFormValues>(EMPTY_FARM_FORM_VALUES);
  const [errors, setErrors] = useState<FarmFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Slide the mobile tab bar out of the way so it doesn't cover the dialog's
    // own controls (same mechanism as FarmDetailSheet).
    document.body.classList.add("sheet-open");

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("sheet-open");
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  const clearFieldError = (field: keyof FarmFormValues) => {
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
    setServerError(null);
  };

  const setFieldValue = (
    field: Exclude<keyof FarmFormValues, "categories">,
    value: string,
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    clearFieldError(field);
  };

  const toggleCategory = (key: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      categories: currentValues.categories.includes(key)
        ? currentValues.categories.filter((value) => value !== key)
        : [...currentValues.categories, key],
    }));
    clearFieldError("categories");
  };

  const resetForm = () => {
    setValues(EMPTY_FARM_FORM_VALUES);
    setErrors({});
    setServerError(null);
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateFarmForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/farms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toCreateFarmInput(values)),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? t("create_error"));
      }

      resetForm();
      onSuccess();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : t("create_error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="qs-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-md"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        aria-labelledby="create-farm-heading"
        aria-modal="true"
        className="glass glass-card qs-sheet max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-[32px] shadow-[0_50px_100px_-24px_rgba(20,22,27,0.45)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-pine">
              {t("create_eyebrow")}
            </p>
            <h2
              className="mt-2.5 text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] text-ink"
              id="create-farm-heading"
            >
              {t("cta_addFarm")}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-ink/60">
              {t("create_subtitle")}
            </p>
          </div>

          <button
            aria-label={t("create_close_aria")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tone text-ink/70 transition hover:bg-ink hover:text-cloud focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="px-6 pb-7 pt-6 sm:px-8 sm:pb-8"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClassName}>{t("create_name_label")}</span>
              <input
                className={fieldClassName}
                name="name"
                onChange={(event) => setFieldValue("name", event.target.value)}
                placeholder="Hofladen Binzenhof"
                value={values.name}
              />
              {errors.name ? (
                <p className="mt-2 text-sm text-rose-600">{t(errors.name)}</p>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClassName}>
                {t("create_address_label")}
              </span>
              <input
                className={fieldClassName}
                name="address"
                onChange={(event) =>
                  setFieldValue("address", event.target.value)
                }
                placeholder="Landhausweg 19, 5000 Aarau"
                value={values.address}
              />
              {errors.address ? (
                <p className="mt-2 text-sm text-rose-600">
                  {t(errors.address)}
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClassName}>{t("create_canton_label")}</span>
              <select
                className={fieldClassName}
                name="canton"
                onChange={(event) =>
                  setFieldValue("canton", event.target.value)
                }
                value={values.canton}
              >
                <option value="">{t("create_canton_placeholder")}</option>
                {SWISS_CANTONS.map((canton) => (
                  <option key={canton.code} value={canton.code}>
                    {canton.code} · {canton.name}
                  </option>
                ))}
              </select>
              {errors.canton ? (
                <p className="mt-2 text-sm text-rose-600">{t(errors.canton)}</p>
              ) : null}
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className={labelClassName}>
                  {t("create_latitude_label")}
                </span>
                <input
                  className={fieldClassName}
                  inputMode="decimal"
                  name="latitude"
                  onChange={(event) =>
                    setFieldValue("latitude", event.target.value)
                  }
                  placeholder="47.3925"
                  value={values.latitude}
                />
                {errors.latitude ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {t(errors.latitude)}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className={labelClassName}>
                  {t("create_longitude_label")}
                </span>
                <input
                  className={fieldClassName}
                  inputMode="decimal"
                  name="longitude"
                  onChange={(event) =>
                    setFieldValue("longitude", event.target.value)
                  }
                  placeholder="8.0457"
                  value={values.longitude}
                />
                {errors.longitude ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {t(errors.longitude)}
                  </p>
                ) : null}
              </label>
            </div>
          </div>

          <fieldset className="mt-5 block">
            <legend className={labelClassName}>
              {t("create_categories_label")}
            </legend>
            <p className="mt-2 text-sm text-ink/60">
              {t("create_categories_hint")}
            </p>
            <div className="mt-3 space-y-2">
              {KNOWN_CATEGORY_KEYS.map((group) => {
                const products = PRODUCTS_BY_GROUP[group] ?? [];
                const selectedCount = products.filter((product) =>
                  values.categories.includes(product),
                ).length;
                const isExpanded = expandedGroup === group;

                return (
                  <div
                    className="overflow-hidden rounded-2xl border border-line"
                    key={group}
                  >
                    <button
                      aria-expanded={isExpanded}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition hover:bg-tone/50"
                      onClick={() =>
                        setExpandedGroup(isExpanded ? null : group)
                      }
                      type="button"
                    >
                      <span aria-hidden="true">{categoryEmoji(group)}</span>
                      <span className="text-sm font-semibold text-ink">
                        {categoryLabel(group, locale)}
                      </span>
                      {selectedCount > 0 ? (
                        <span className="rounded-full bg-pine/10 px-2 py-0.5 text-xs font-bold text-pine">
                          {selectedCount}
                        </span>
                      ) : null}
                      <ChevronDown
                        className={`ml-auto h-4 w-4 text-ink/60 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isExpanded ? (
                      <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-3">
                        {products.map((product) => {
                          const isSelected =
                            values.categories.includes(product);
                          return (
                            <button
                              aria-pressed={isSelected}
                              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ink/20 ${
                                isSelected
                                  ? "border-ink bg-ink text-cloud"
                                  : "border-line bg-cloud text-ink/70 hover:border-ink/30 hover:text-ink"
                              }`}
                              key={product}
                              onClick={() => toggleCategory(product)}
                              type="button"
                            >
                              {productLabel(product, locale)}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {errors.categories ? (
              <p className="mt-2 text-sm text-rose-600">
                {t(errors.categories)}
              </p>
            ) : null}
          </fieldset>

          {serverError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              {serverError}
            </div>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
            <button
              className="rounded-full border border-line bg-cloud px-6 py-3.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              {t("create_close")}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-cloud shadow-[0_16px_36px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {t("create_saving")}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {t("create_submit")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
