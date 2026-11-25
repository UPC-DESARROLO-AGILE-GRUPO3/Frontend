"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClaimDeviceForm } from "@/components/forms/ClaimDeviceForm";
import { useState } from "react";
import { Link as LinkIcon } from "lucide-react";

export function ClaimDeviceDialog({ onClaimSuccess }: { onClaimSuccess?: () => void } = {}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-24 flex-col hover:bg-primary hover:text-primary-foreground transition-all border-2 hover:scale-105 hover:shadow-lg">
            <LinkIcon className="h-7 w-7 mb-2" />
            <span className="font-semibold">Vincular Banda</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vincular Nueva Banda</DialogTitle>
          <DialogDescription>
            Ingresa el ID único de tu dispositivo para comenzar a recibir datos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
            <ClaimDeviceForm onClaimSuccess={() => {
              setOpen(false);
              onClaimSuccess?.();
            }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
