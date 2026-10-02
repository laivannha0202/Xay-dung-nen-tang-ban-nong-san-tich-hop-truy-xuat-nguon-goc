'use client';

/**
 * AGRIMARKET-ADMIN-SHELL-PERSIST-V8
 *
 * Skeleton CHỈ thuộc vùng Content.
 *
 * Next.js bọc `page.tsx` trong `<Suspense fallback={loading}>` ngay tại segment
 * `app/`. `layout.tsx` (Sidebar + Header) nằm NGOÀI boundary nên khi đổi route
 * người dùng vẫn thấy nguyên menu và header — chỉ vùng nội dung là skeleton.
 *
 * Không có file này, App Router giữ trang cũ cho tới khi RSC payload trang mới
 * tới; người dùng không có bất kỳ phản hồi trực quan nào khi click menu.
 */
export default function LoadingNoiDung() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Đang tải nội dung trang"
      className="agrimarket-admin-loading-content"
      style={{ display: 'grid', gap: 16 }}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        <div
          style={{
            width: 220,
            height: 26,
            borderRadius: 8,
            background: 'linear-gradient(90deg,#EDF3EF 25%,#F6FAF8 37%,#EDF3EF 63%)',
            backgroundSize: '400% 100%',
            animation: 'agrimarket-admin-loading-skeleton 1.4s ease infinite',
          }}
        />
        <div
          style={{
            width: 340,
            maxWidth: '70%',
            height: 14,
            borderRadius: 7,
            background: 'linear-gradient(90deg,#EDF3EF 25%,#F6FAF8 37%,#EDF3EF 63%)',
            backgroundSize: '400% 100%',
            animation: 'agrimarket-admin-loading-skeleton 1.4s ease infinite',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 12,
        }}
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              height: 92,
              borderRadius: 12,
              border: '1px solid #DCE7DF',
              background: 'linear-gradient(90deg,#EDF3EF 25%,#F6FAF8 37%,#EDF3EF 63%)',
              backgroundSize: '400% 100%',
              animation: 'agrimarket-admin-loading-skeleton 1.4s ease infinite',
            }}
          />
        ))}
      </div>

      <div
        style={{
          height: 320,
          borderRadius: 12,
          border: '1px solid #DCE7DF',
          background: 'linear-gradient(90deg,#EDF3EF 25%,#F6FAF8 37%,#EDF3EF 63%)',
          backgroundSize: '400% 100%',
          animation: 'agrimarket-admin-loading-skeleton 1.4s ease infinite',
        }}
      />
    </div>
  );
}
