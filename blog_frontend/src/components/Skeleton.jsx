// src/components/Skeleton.jsx
export function SkeletonLine({ width = '100%', height = 12, style = {} }) {
  return <div className="skeleton skeleton-line" style={{ width, height, ...style }} />;
}

export function SkeletonAvatar({ size = 48, style = {} }) {
  return <div className="skeleton skeleton-avatar" style={{ width: size, height: size, ...style }} />;
}

export function SkeletonCard({ height = 160, style = {} }) {
  return <div className="skeleton skeleton-card" style={{ height, ...style }} />;
}

export default function SkeletonList({ count = 6 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card" key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SkeletonAvatar />
            <div style={{ flex: 1 }}>
              <SkeletonLine width="40%" />
              <SkeletonLine width="25%" style={{ marginTop: 6 }} />
            </div>
          </div>
          <SkeletonLine width="100%" style={{ marginTop: 12 }} />
          <SkeletonLine width="80%" style={{ marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}
