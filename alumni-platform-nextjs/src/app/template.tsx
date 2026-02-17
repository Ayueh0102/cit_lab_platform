/**
 * Next.js template.tsx — 每次路由切換時重新掛載，
 * 觸發 CSS fade-in 動畫。比 layout.tsx 更適合做過場效果。
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-enter">
      {children}
    </div>
  );
}
