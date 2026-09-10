"use client"

import { useState, useTransition } from "react"
import { CameraIcon, LoaderCircleIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { removePersonPhoto, setPersonPhoto } from "@/app/(app)/people/actions"
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
import { STORAGE_BUCKET } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { extensionFor } from "@/lib/upload"

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
      setError("Paste, drop or choose an image first.")
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
            Paste a screenshot with win+shift+S, or drop a file. It goes into the private bucket
            and is only ever served through a short-lived signed link.
          </DialogDescription>
        </DialogHeader>

        <ImageDropzone file={file} onFile={setFile} onError={setError} disabled={busy} />

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
