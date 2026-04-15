"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, User, Package, ImageIcon, Pencil, X } from "lucide-react";
import { useMithril } from "./MithrilContext";
import type { PropMetadata } from "./PropDesigner/types";
import type { BackgroundMetadata } from "./BgSheetGenerator/types";

interface AssetCardProps {
  imageUrl: string;
  name: string;
  onRename?: (newName: string) => Promise<void>;
  onRemove?: () => Promise<void>;
}

function AssetCard({ imageUrl, name, onRename, onRemove }: AssetCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = async () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      await onRename?.(trimmed);
    } else {
      setDraft(name);
    }
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-100 dark:bg-gray-800 p-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700">
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(name); setEditing(false); }
          }}
          className="flex-1 min-w-0 rounded bg-gray-700 px-1.5 py-0.5 text-xs font-medium text-gray-200 outline-none focus:ring-1 focus:ring-teal-500"
        />
      ) : (
        <p className="flex-1 truncate text-xs font-medium text-gray-700 dark:text-gray-300">{name}</p>
      )}
      <div className="flex shrink-0 items-center gap-1">
        {onRename && !editing && (
          <button
            onClick={() => { setDraft(name); setEditing(true); }}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            title="Rename asset"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Remove from assets"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

interface SubsectionProps {
  label: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}

function Subsection({ label, icon, count, children }: SubsectionProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-1.5 text-left"
      >
        {open
          ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
          : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
        }
        <span className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
          {icon}
          {label}
        </span>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{count}</span>
      </button>
      {open && <div className="flex flex-col gap-1.5">{children}</div>}
    </div>
  );
}

type PropWithImage = PropMetadata & { designSheetImageRef: string };
const BACKGROUND_ANGLES = [
  "Front View",
  "Worm View",
  "Character A View",
  "Character B View",
  "Rear View",
  "Bird's Eye View",
  "Over-Shoulder A",
  "Over-Shoulder B",
  "Floor Close-up",
];

type BackgroundWithImage = { bg: BackgroundMetadata; imageUrl: string; angle: string; slotLabel: string };

export default function SidebarAssetSection() {
  const { propDesignerGenerator, bgSheetGenerator, renameProp, unpushProp, unpushBg } = useMithril();

  const allProps = propDesignerGenerator.result?.props ?? [];
  const characters = allProps.filter((p): p is PropWithImage =>
    p.category === "character" && !!p.designSheetImageRef && p.pushedToAssets === true
  );
  const objects = allProps.filter((p): p is PropWithImage =>
    p.category === "object" && !!p.designSheetImageRef && p.pushedToAssets === true
  );

  const activeBgPartIndex = bgSheetGenerator.activeBgPartIndex ?? 0;
  const backgrounds: BackgroundWithImage[] = (bgSheetGenerator.result?.backgrounds ?? [])
    .filter(bg => bg.pushedToAssets === true && (bg.partIndex ?? 0) === activeBgPartIndex)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .flatMap((bg, bgSortedIndex) => (
      bg.images
        .filter(i => !!i.imageId)
        .map(i => {
          const standardAngleIndex = BACKGROUND_ANGLES.indexOf(i.angle);
          const slotLabel = standardAngleIndex >= 0
            ? `${bgSortedIndex + 1}-${standardAngleIndex + 1}`
            : i.angle;
          return { bg, imageUrl: i.imageId ?? "", angle: i.angle, slotLabel };
        })
    ))
    .filter(item => item.imageUrl !== "");

  if (characters.length === 0 && objects.length === 0 && backgrounds.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Assets
      </p>
      {characters.length > 0 && (
        <Subsection label="Characters" icon={<User className="h-3.5 w-3.5" />} count={characters.length}>
          {characters.map(p => (
            <AssetCard
              key={p.id}
              imageUrl={p.designSheetImageRef}
              name={p.name}
              onRename={newName => renameProp(p.id, newName)}
              onRemove={() => unpushProp(p.id)}
            />
          ))}
        </Subsection>
      )}
      {objects.length > 0 && (
        <Subsection label="Objects" icon={<Package className="h-3.5 w-3.5" />} count={objects.length}>
          {objects.map(p => (
            <AssetCard
              key={p.id}
              imageUrl={p.designSheetImageRef}
              name={p.name}
              onRename={newName => renameProp(p.id, newName)}
              onRemove={() => unpushProp(p.id)}
            />
          ))}
        </Subsection>
      )}
      {backgrounds.length > 0 && (
        <Subsection label="Backgrounds" icon={<ImageIcon className="h-3.5 w-3.5" />} count={backgrounds.length}>
          {backgrounds.map(({ bg, imageUrl, angle, slotLabel }) => (
            <AssetCard
              key={`${bg.id}-${angle}`}
              imageUrl={imageUrl}
              name={slotLabel}
              onRemove={() => unpushBg(bg.id)}
            />
          ))}
        </Subsection>
      )}
    </div>
  );
}
