"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { respondToProposalAction } from "@/app/(app)/proposals/actions";

type Action = "accept" | "reject" | "counter" | "withdraw";

export function ProposalActions({
  proposalId,
  role,
  status,
}: {
  proposalId: string;
  role: "owner" | "operator";
  /** current proposal status */
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");

  const run = (action: Action, amount?: number) =>
    startTransition(async () => {
      setError(null);
      const res = await respondToProposalAction(proposalId, action, amount);
      if (res.error) setError(res.error);
      else router.refresh();
    });

  // Terminal states — no actions.
  if (["rejected", "withdrawn", "accepted"].includes(status)) {
    return null;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {role === "owner" && (
          <>
            <Button
              variant="success"
              disabled={pending}
              onClick={() => run("accept")}
            >
              Accept
            </Button>

            <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={pending}>
                  Counter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Counter offer</DialogTitle>
                  <DialogDescription>
                    Propose a different guaranteed monthly rent.
                  </DialogDescription>
                </DialogHeader>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    placeholder="New monthly amount"
                    className="pl-6"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setCounterOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={pending || !counterAmount}
                    onClick={() => {
                      run("counter", parseFloat(counterAmount));
                      setCounterOpen(false);
                    }}
                  >
                    Send counter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => run("reject")}
            >
              Reject
            </Button>
          </>
        )}

        {role === "operator" && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => run("withdraw")}
          >
            Withdraw proposal
          </Button>
        )}
      </div>
    </div>
  );
}
