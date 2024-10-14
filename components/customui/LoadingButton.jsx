import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
// interface LoadingButtonProps extends ButtonProps {
//   loading: boolean;
// }
export default function LoadingButton({
  loading,
  disabled,
  className,
  ...props
}) {
  return (
    <Button
      disabled={loading || disabled}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {loading && <Loader2 className="size-5 animate-spin" />}
      {props.children}
    </Button>
  );
}
