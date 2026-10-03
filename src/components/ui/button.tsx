import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[opacity,transform,background-color,color,border-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-fg text-bg hover:opacity-90",
        secondary: "bg-raised text-fg border border-border hover:border-border-strong",
        ghost: "text-muted hover:text-fg hover:bg-raised",
        outline: "border border-border bg-transparent text-fg hover:bg-raised",
        ember: "bg-ember text-fg hover:opacity-90",
      },
      size: {
        default: "h-11 rounded-sm px-5",
        sm: "h-9 rounded-sm px-3 text-xs",
        lg: "h-12 rounded-md px-6 text-base",
        icon: "size-11 rounded-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
