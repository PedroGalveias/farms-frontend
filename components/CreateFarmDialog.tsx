"use client";

import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";
import {
  EMPTY_FARM_FORM_VALUES,
  parseCategoriesInput,
  toCreateFarmInput,
  validateFarmForm,
} from "@/lib/farm-form";
import { SWISS_CANTONS } from "@/lib/farms";
import type { FarmFormErrors, FarmFormValues } from "@/types/farm";

interface CreateFarmDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink shadow-sm transition placeholder:text-ink/35 focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function CreateFarmDialog({
  open,
  onClose,
  onSuccess,
}: CreateFarmDialogProps) {
  const [values, setValues] = useState<FarmFormValues>(EMPTY_FARM_FORM_VALUES);
  const [errors, setErrors] = useState<FarmFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
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

  const categoryPreview = parseCategoriesInput(values.categories);

  const setFieldValue = (field: keyof FarmFormValues, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });

    setServerError(null);
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
        throw new Error(
          payload?.error ?? "Unable to create new farm right now.",
        );
      }

      resetForm();
      onSuccess();
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to create new farm right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest/45 px-4 py-6 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        aria-labelledby="create-farm-heading"
        aria-modal="true"
        className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/60 bg-surface shadow-[0_40px_120px_rgba(31,42,33,0.22)]"
        role="dialog"
      >
        <div className="border-b border-border bg-forest px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">
                New entry
              </p>
              <h2
                className="mt-3 text-4xl leading-none"
                id="create-farm-heading"
              >
                Add new farm
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                Swiss canton codes, Swiss coordinates, and at least one
                category.
              </p>
            </div>

            <button
              aria-label="Close create farm dialog"
              className="rounded-full border border-white/15 bg-white/10 p-2 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form className="p-6 sm:p-8" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-forest">
                Farm name
              </span>
              <input
                className={fieldClassName}
                name="name"
                onChange={(event) => setFieldValue("name", event.target.value)}
                placeholder="Hofladen Binzenhof"
                value={values.name}
              />
              {errors.name ? (
                <p className="mt-2 text-sm text-rose-700">{errors.name}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-forest">Address</span>
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
                <p className="mt-2 text-sm text-rose-700">{errors.address}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-forest">Canton</span>
              <select
                className={fieldClassName}
                name="canton"
                onChange={(event) =>
                  setFieldValue("canton", event.target.value)
                }
                value={values.canton}
              >
                <option value="">Select a Swiss canton</option>
                {SWISS_CANTONS.map((canton) => (
                  <option key={canton.code} value={canton.code}>
                    {canton.code} · {canton.name}
                  </option>
                ))}
              </select>
              {errors.canton ? (
                <p className="mt-2 text-sm text-rose-700">{errors.canton}</p>
              ) : null}
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-forest">
                  Latitude
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
                  <p className="mt-2 text-sm text-rose-700">
                    {errors.latitude}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-forest">
                  Longitude
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
                  <p className="mt-2 text-sm text-rose-700">
                    {errors.longitude}
                  </p>
                ) : null}
              </label>
            </div>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-forest">
              Categories
            </span>
            <textarea
              className={`${fieldClassName} min-h-32 resize-y`}
              name="categories"
              onChange={(event) =>
                setFieldValue("categories", event.target.value)
              }
              placeholder="Organic, Fruit, Vegetables, Eggs"
              value={values.categories}
            />
            <p className="mt-2 text-sm text-ink/60">
              Separate categories with commas or line breaks.
            </p>
            {errors.categories ? (
              <p className="mt-2 text-sm text-rose-700">{errors.categories}</p>
            ) : null}
          </label>

          {categoryPreview.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryPreview.map((category) => (
                <span
                  className="rounded-full bg-forest/8 px-3 py-1 text-sm font-medium text-forest"
                  key={category}
                >
                  {category}
                </span>
              ))}
            </div>
          ) : null}

          {serverError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {serverError}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <button
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-ink transition hover:bg-forest/5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Close
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c96f3d] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving farm
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create farm
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
