"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createContact,
  updateContact,
  type Contact,
} from "@/lib/contacts";
import {
  PRIORITIES,
  validateContact,
  type FieldErrors,
} from "@/lib/validation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; absent when creating. */
  contact: Contact | null;
  onSaved: () => void;
}

const EMPTY = {
  name: "",
  company: "",
  role: "",
  met_at: "",
  notes: "",
  priority: "medium" as string,
};

export function ContactDialog({ open, onOpenChange, contact, onSaved }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = contact !== null;

  // Reload the form whenever the dialog opens so a cancelled edit never leaks
  // into the next one.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError(null);
    setForm(
      contact
        ? {
            name: contact.name,
            company: contact.company ?? "",
            role: contact.role ?? "",
            met_at: contact.met_at ?? "",
            notes: contact.notes ?? "",
            priority: contact.priority,
          }
        : EMPTY,
    );
  }, [open, contact]);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear this field's error as soon as the user starts fixing it; leaving a
    // stale "Name is required" under a filled-in box reads as a broken form.
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    // Fast, field-level feedback. The database re-checks all of this.
    const result = validateContact(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      if (isEdit) {
        await updateContact(contact.id, result.value);
        toast.success("Contact updated");
      } else {
        await createContact(result.value);
        toast.success("Contact added");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      // Anything the database rejected that the client let through.
      setFormError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit contact" : "Add contact"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update what you know about this person."
              : "Someone you want to stay connected with."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="text-destructive text-sm">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="met_at">Where you met</Label>
            <Input
              id="met_at"
              placeholder="Cal career fair, CS 161 office hours…"
              value={form.met_at}
              onChange={(e) => set("met_at", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">
              Priority <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.priority}
              onValueChange={(value) => set("priority", value)}
            >
              <SelectTrigger id="priority" className="w-full">
                <SelectValue placeholder="Choose a priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priority && (
              <p role="alert" className="text-destructive text-sm">
                {errors.priority}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="What you talked about, what to follow up on…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {formError && (
            <p
              role="alert"
              className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
            >
              {formError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
