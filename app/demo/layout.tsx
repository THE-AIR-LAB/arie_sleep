import { THEME_BOOT_SCRIPT } from "./studio-components/chat/constants";

/**
 * Runs before React hydrates so auth-loading + studio splash share the saved
 * mono/sepia backdrop (no white flash when sepia is on).
 */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      {children}
    </>
  );
}
