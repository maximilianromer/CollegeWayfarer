import { Info } from "lucide-react";

export function MuseumBanner() {
  return (
    <div className="bg-amber-100 border-b border-amber-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-800 text-sm">
        <Info className="h-4 w-4 flex-shrink-0" />
        <span className="text-center">
          This project has been put into museum mode. While you can still navigate it as a demo, all of the functionality has been disabled.
        </span>
      </div>
    </div>
  );
}
