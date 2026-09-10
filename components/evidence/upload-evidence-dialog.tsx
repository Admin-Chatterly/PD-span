"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { LoaderCircleIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"
import { addEvidenceFile } from "@/app/(app)/evidence/actions"
import { ImageDropzone } from "@/components/image-dropzone"
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
import { extensionFor } from "@/lib/upload"

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
            Take a screenshot with win+shift+S and paste it straight in. It goes into the private
            bucket and is only ever served through a short-lived signed link.
          </DialogDescription>
        </DialogHeader>
        {/* Remounting clears the previous selection when the dialog reopens. */}
        {open ? <UploadForm target={target} onSaved={() => setOpen(false)} /> : null}
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
      setError("Paste, drop or choose an image first.")
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

      <ImageDropzone file={file} onFile={setFile} onError={setError} disabled={pending} />

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
