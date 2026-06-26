"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { messageSchema } from "@/lib/validations";

export async function sendMessageAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireUser();

  const parsed = messageSchema.safeParse({
    proposal_id: formData.get("proposal_id"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: "Message can't be empty." };
  }

  try {
    const supabase = await createClient();

    // Confirm the user participates in this proposal thread.
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, owner_id, operator_id")
      .eq("id", parsed.data.proposal_id)
      .single();

    if (
      !proposal ||
      (proposal.owner_id !== user.id && proposal.operator_id !== user.id)
    ) {
      return { error: "Not authorized to message in this thread." };
    }

    const { error } = await supabase.from("messages").insert({
      proposal_id: parsed.data.proposal_id,
      sender_id: user.id,
      body: parsed.data.body,
    });
    if (error) return { error: error.message };

    // Notify the other participant. Best-effort: never let a notification
    // failure break sending the message.
    const recipient =
      proposal.owner_id === user.id ? proposal.operator_id : proposal.owner_id;
    const { error: notifyError } = await supabase.rpc("create_notification", {
      p_user_id: recipient,
      p_type: "message_received",
      p_title: "New message",
      p_body: parsed.data.body.slice(0, 120),
      p_link: `/proposals/${parsed.data.proposal_id}`,
    });
    if (notifyError) {
      console.warn("Failed to create message notification:", notifyError.message);
    }

    revalidatePath(`/proposals/${parsed.data.proposal_id}`);
    return {};
  } catch (err) {
    console.error("sendMessageAction failed:", err);
    return { error: "Couldn't send your message. Please try again." };
  }
}
