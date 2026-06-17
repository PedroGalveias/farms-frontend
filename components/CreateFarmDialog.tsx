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
  "mt-2 w-full rounded-2xl border border-transparent bg-tone px-4 py-3 text-sm font-medium text-ink transition duration-300 placeholder:font-normal placeholder:text-ink/35 focus:border-pine/50 focus:bg-cloud focus:ring-4 focus:ring-pine/10";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-ink/55";

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
      className="qs-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-md"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        aria-labelledby="create-farm-heading"
        aria-modal="true"
        className="qs-sheet max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-line bg-cloud shadow-[0_50px_100px_-24px_rgba(20,22,27,0.45)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-pine">
              New entry
            </p>
            <h2
              className="mt-2.5 text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] text-ink"
              id="create-farm-heading"
            >
              Add a farm
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-ink/50">
              A Swiss canton, Swiss coordinates, and at least one category.
            </p>
          </div>

          <button
            aria-label="Close create farm dialog"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tone text-ink/60 transition hover:bg-ink hover:text-cloud focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-50"
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
              <span className={labelClassName}>Farm name</span>
              <input
                className={fieldClassName}
                name="name"
                onChange={(event) => setFieldValue("name", event.target.value)}
                placeholder="Hofladen Binzenhof"
                value={values.name}
              />
              {errors.name ? (
                <p className="mt-2 text-sm text-rose-600">{errors.name}</p>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClassName}>Address</span>
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
                <p className="mt-2 text-sm text-rose-600">{errors.address}</p>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClassName}>Canton</span>
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
                <p className="mt-2 text-sm text-rose-600">{errors.canton}</p>
              ) : null}
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className={labelClassName}>Latitude</span>
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
                    {errors.latitude}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className={labelClassName}>Longitude</span>
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
                    {errors.longitude}
                  </p>
                ) : null}
              </label>
            </div>
          </div>

          <label className="mt-5 block">
            <span className={labelClassName}>Categories</span>
            <textarea
              className={`${fieldClassName} min-h-28 resize-y`}
              name="categories"
              onChange={(event) =>
                setFieldValue("categories", event.target.value)
              }
              placeholder="Organic, Fruit, Vegetables, Eggs"
              value={values.categories}
            />
            <p className="mt-2 text-sm text-ink/40">
              Separate categories with commas or line breaks.
            </p>
            {errors.categories ? (
              <p className="mt-2 text-sm text-rose-600">{errors.categories}</p>
            ) : null}
          </label>

          {categoryPreview.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {categoryPreview.map((category) => (
                <span
                  className="rounded-full bg-tone px-3 py-1 text-sm font-medium text-ink/70"
                  key={category}
                >
                  {category}
                </span>
              ))}
            </div>
          ) : null}

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
              Close
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-cloud shadow-[0_16px_36px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
