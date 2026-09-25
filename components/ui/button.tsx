import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" };

export function Button({ className, variant = "primary", ...props }: Props) {
  return <button className={cn("btn", `btn-${variant}`, className)} {...props} />;
}
