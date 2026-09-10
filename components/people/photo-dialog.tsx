"use client"

import { useState, useTransition } from "react"
import { CameraIcon, LoaderCircleIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { removePersonPhoto, setPersonPhoto } from "@/app/(app)/people/actions"
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
import { STORAGE_BUCKET } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

function extensionFor(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : null
  if (fromName && /^[a-z0-9]{1,5}$/i.test(fromName)) return fromName.toLowerCase()
  return file.type === "image/jpeg" ? "jpg" : file.type.replace("image/", "") || "bin"
}

/** Uploads a mugshot straight to Storage, then points the record at it. */
export function PhotoDialog({ personId, hasPhoto }: { personId: string; hasPhoto: boolean }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)

  async function upload() {
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
      const path = `people/${personId}/photo/${crypto.randomUUID()}.${extensionFor(file)}`
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) {
        setError(uploadError.message)
        return
      }
      startTransition(async () => {
        const result = await setPersonPhoto(personId, path)
        if (!result.ok) {
          setError(result.error)
          return
        }
        toast.success("Photo updated")
        setFile(null)
        setOpen(false)
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The upload failed.")
    } finally {
      setUploading(false)
    }
  }

  function remove() {
    startTransition(async () => {
      const result = await removePersonPhoto(personId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Photo removed")
      setOpen(false)
    })
  }

  const busy = uploading || pending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CameraIcon /> {hasPhoto ? "Change photo" : "Add photo"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasPhoto ? "Change the photo" : "Add a photo"}</DialogTitle>
          <DialogDescription>
            Up to 10 MB. It goes into the private bucket and is only ever served through a
            short-lived signed link.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="person_photo">Image</Label>
          <Input
            id="person_photo"
            type="file"
            accept={ACCEPTED.join(",")}
            disabled={busy}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setError(null)
            }}
          />
          {file ? (
            <p className="text-xs text-muted-foreground">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter className="sm:justify-between">
          {hasPhoto ? (
            <Button
              type="button"
              variant="ghost"
              onClick={remove}
              disabled={busy}
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon /> Remove
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" onClick={upload} disabled={busy || !file}>
            {busy ? <LoaderCircleIcon className="animate-spin" /> : <CameraIcon />}
            {uploading ? "Uploading…" : "Save photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
