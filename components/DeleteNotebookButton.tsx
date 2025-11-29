"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteNotebook } from "@/app/actions/notes/actions";

type DeleteNotebookButtonProps = {
  notebookId: string;
};

export default function DeleteNotebookButton({
  notebookId,
}: DeleteNotebookButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    const ok = window.confirm(
      "Delete this notebook? Notes will become quick notes, not deleted."
    );
    if (!ok) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", notebookId);
      await deleteNotebook(fd);

      // After deleting, go back to /notes
      router.push("/notes");
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-lg border border-error/70 bg-error/10 px-2 py-1 text-[10px] font-semibold text-error hover:bg-error/20 disabled:opacity-60"
      title="Delete notebook"
    >
      <Trash2 className="h-3 w-3" />
      {isPending ? "Deleting..." : "Delete notebook"}
    </button>
  );
}
