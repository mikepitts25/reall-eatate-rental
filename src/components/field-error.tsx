export function FieldError({ message }: { message?: string | string[] }) {
  if (!message) return null;
  const text = Array.isArray(message) ? message[0] : message;
  if (!text) return null;
  return <p className="mt-1 text-xs text-destructive">{text}</p>;
}

export function FormMessage({
  message,
  variant = "error",
}: {
  message?: string | null;
  variant?: "error" | "success";
}) {
  if (!message) return null;
  return (
    <p
      className={
        variant === "error"
          ? "rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "rounded-md bg-success/10 px-3 py-2 text-sm text-success-foreground"
      }
    >
      {message}
    </p>
  );
}
