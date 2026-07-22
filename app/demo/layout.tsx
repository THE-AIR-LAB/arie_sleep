/**
 * Demo segment layout. Theme boot script lives in the root layout
 * (`next/script` beforeInteractive) so React 19 doesn't warn on a raw
 * <script> rendered from this nested layout.
 */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
