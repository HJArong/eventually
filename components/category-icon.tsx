import {
  Aperture,
  Building2,
  Cake,
  Camera,
  Flame,
  Flower2,
  Martini,
  Mic,
  Speaker,
  Sparkles,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "building-2": Building2,
  utensils: Utensils,
  flame: Flame,
  speaker: Speaker,
  mic: Mic,
  camera: Camera,
  "flower-2": Flower2,
  cake: Cake,
  martini: Martini,
  aperture: Aperture,
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? Sparkles;
  return <Icon className={className ?? "size-4"} aria-hidden />;
}
