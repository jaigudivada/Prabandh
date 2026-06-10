import branding from '../config/branding';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white/50 px-4 py-6 text-center dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {branding.copyright.full}
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {branding.copyright.attribution}
        </p>
      </div>
    </footer>
  );
}