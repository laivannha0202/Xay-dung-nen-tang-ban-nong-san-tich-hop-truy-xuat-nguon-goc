import type { DimensionValue } from 'react-native';
import { View } from 'react-native';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className,
}: SkeletonProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`bg-muted ${className ?? ''}`}
      style={{ width, height, borderRadius }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton height={176} borderRadius={0} />
      <View className="gap-3 p-4">
        <Skeleton width="34%" height={20} borderRadius={999} />
        <Skeleton width="82%" height={20} />
        <Skeleton width="58%" height={16} />
        <Skeleton width="44%" height={22} />
      </View>
    </View>
  );
}

export function FarmCardSkeleton() {
  return (
    <View className="flex-row gap-3 rounded-2xl border border-border bg-card p-3">
      <Skeleton width={88} height={88} borderRadius={14} />
      <View className="flex-1 justify-center gap-3">
        <Skeleton width="70%" height={20} />
        <Skeleton width="92%" height={16} />
        <Skeleton width="45%" height={20} borderRadius={999} />
      </View>
    </View>
  );
}

export type { SkeletonProps };
