import { ModeToggle } from "./mode-toogle";

export async function Footer() {
  return (
    <footer className="border-t">
      <div className="flex h-full w-full items-center justify-between px-20 py-12 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Saborio. All rights reserved.</p>
        <ModeToggle size="icon-lg" />
      </div>
    </footer>
  );
}
