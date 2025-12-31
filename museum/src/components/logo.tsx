import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn("text-2xl font-extrabold tracking-tighter", className)}>
      <span className="text-primary">College</span>
      <span className="text-foreground">Wayfarer</span>
    </div>
  );
}
