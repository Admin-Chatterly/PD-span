"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { LoaderCircleIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"
import { addEvidenceFile } from "@/app/(app)/evidence/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormState } from "@/lib/action-types"
import { STORAGE_BUCKET } from "@/lib/constants"
import type { EvidenceTarget } from "@/lib/data/evidence"
import { createClient } from "@/lib/supabase/client"

/** Mirrors the bucket's own limits, so a rejection is explained before uploading. */
const MAX_BYTES = 10 * 1024 * 1024
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

function extensionFor(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : null
  if (fromName && /^[a-z0-9]{1,5}$/i.test(fromName)) return fromName.toLowerCase()
  return file.type === "image/jpeg" ? "jpg" : file.type.replace("image/", "") || "bin"
}

function targetFolder(target: EvidenceTarget): string {
  if (target.personId) return `people/${target.personId}`
  if (target.organizationId) return `organizations/${target.organizationId}`
  if (target.caseId) return `cases/${target.caseId}`
  return "unfiled"
}

export function UploadEvidenceDialog({ target }: { target: EvidenceTarget }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UploadIcon /> Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload evidence</DialogTitle>
          <DialogDescription>
            A screenshot or photo, up to 10 MB. It goes into the private bucket and is only ever
            served through a short-lived signed link.
          </DialogDescription>
        </DialogHeader>
        <UploadForm target={target} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function UploadForm({ target, onSaved }: { target: EvidenceTarget; onSaved: () => void }) {
  const [state, formAction, savePending] = useActionState(addEvidenceFile, {} as FormState)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storagePath, setStoragePath] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) {
      toast.success("Evidence uploaded")
      onSaved()
    }
  }, [state, onSaved])

  /**
   * The file goes straight from the browser to Storage; only its path is sent
   * to the server. That keeps a 10 MB image away from the request body limit.
   */
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (storagePath) return // already uploaded, let the action run
    event.preventDefault()
    setError(null)

    if (!file) {
      setError("Choose an image first.")
      return
    }
    if (!ACCEPTED.includes(file.type)) {
      setError("That file type is not accepted. Use JPEG, PNG, WebP or GIF.")
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB.`)
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const path = `${targetFolder(target)}/${crypto.randomUUID()}.${extensionFor(file)}`
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) {
        setError(uploadError.message)
        return
      }
      setStoragePath(path)
      // The hidden input is now filled in, so the server action can record it.
      requestAnimationFrame(() => formRef.current?.requestSubmit())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const pending = uploading || savePending

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} className="flex flex-col gap-4">
      {target.personId ? <input type="hidden" name="person_id" value={target.personId} /> : null}
      {target.organizationId ? (
        <input type="hidden" name="organization_id" value={target.organizationId} />
      ) : null}
      {target.caseId ? <input type="hidden" name="case_id" value={target.caseId} /> : null}
      <input type="hidden" name="storage_path" value={storagePath} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="evidence_file">Image</Label>
        <Input
          id="evidence_file"
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setError(null)
          }}
          disabled={pending}
        />
        {file ? (
          <p className="text-xs text-muted-foreground">
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="upload_caption">Caption</Label>
        <Input
          id="upload_caption"
          name="caption"
          maxLength={500}
          placeholder="What it shows, when, where"
          disabled={pending}
        />
      </div>

      {error || state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {error ?? state.error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="submit" disabled={pending || !file}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : <UploadIcon />}
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </DialogFooter>
    </form>
  )
}
