// ui/SortableList.tsx
"use client";

import React from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable, isSortable } from "@dnd-kit/react/sortable";
import { GripVertical } from "lucide-react";
import { cn } from "~/lib/utils";

interface SortableListProps<T> {
  items: T[];
  className?: string;
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
}

interface SortableItemProps {
  id: string | number;
  index: number;
  children: React.ReactNode;
}

function SortableItem({ id, index, children }: SortableItemProps) {
  const { ref } = useSortable({ id, index });

  return (
    <li
      ref={ref}
      className="mb-2 flex w-full cursor-move items-center rounded-sm bg-background p-4 shadow hover:bg-muted"
    >
      <GripVertical className="mr-2 inline-block text-muted-foreground" />
      {children}
    </li>
  );
}

export function SortableList<T extends { id: string | number }>({
  items,
  className,
  onChange,
  renderItem,
}: SortableListProps<T>) {
  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source } = event.operation;

        if (isSortable(source)) {
          const { initialIndex, index } = source;

          if (initialIndex !== index) {
            const newItems = [...items];
            const [moved] = newItems.splice(initialIndex, 1);
            newItems.splice(index, 0, moved as T);
            onChange(newItems);
          }
        }
      }}
    >
      <ul className={cn("w-full", className)}>
        {items.map((item, index) => (
          <SortableItem key={item.id} id={item.id} index={index}>
            {renderItem(item, index)}
          </SortableItem>
        ))}
      </ul>
    </DragDropProvider>
  );
}
