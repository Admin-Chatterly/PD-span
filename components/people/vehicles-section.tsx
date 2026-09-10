import { Trash2Icon, UnlinkIcon } from "lucide-react"
import { deleteVehicle, unlinkVehicle } from "@/app/(app)/people/actions"
import { ActionButton } from "@/components/action-button"
import { AddVehicleDialog } from "@/components/people/add-vehicle-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Tables } from "@/lib/database.types"

export function VehiclesSection({ personId, vehicles }: { personId: string; vehicles: Tables<"vehicles">[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vehicles</CardTitle>
        <AddVehicleDialog personId={personId} />
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vehicles on file.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {vehicles.map((v) => (
              <li key={v.id} className="flex items-start justify-between gap-2 py-2">
                <div className="flex min-w-0 flex-col">
                  <span className="font-mono text-base font-semibold tracking-wider">{v.plate ?? "NO PLATE"}</span>
                  <span className="text-sm text-muted-foreground">
                    {[v.color, v.model].filter(Boolean).join(" ") || "Model unknown"}
                  </span>
                  {v.notes ? <span className="text-xs text-muted-foreground">{v.notes}</span> : null}
                </div>
                <div className="flex shrink-0 items-center">
                  <ActionButton
                    action={unlinkVehicle.bind(null, v.id, personId)}
                    variant="ghost"
                    size="icon-sm"
                    title="Unlink (keeps the vehicle on file without an owner)"
                    successMessage="Vehicle unlinked"
                  >
                    <UnlinkIcon />
                  </ActionButton>
                  <ActionButton
                    action={deleteVehicle.bind(null, v.id, personId)}
                    variant="ghost"
                    size="icon-sm"
                    title="Delete"
                    className="text-muted-foreground hover:text-destructive"
                    confirm={{
                      title: `Delete ${v.plate ?? "this vehicle"}?`,
                      description: "Unlink instead if you only want to detach it from this person.",
                      actionLabel: "Delete",
                      destructive: true,
                    }}
                    successMessage="Vehicle deleted"
                  >
                    <Trash2Icon />
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
