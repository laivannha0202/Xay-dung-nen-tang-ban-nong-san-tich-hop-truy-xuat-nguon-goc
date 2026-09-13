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
      className={`bg-[#EAF0EC] ${className ?? ''}`}
      style={{ width, height, borderRadius }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View className="w-full overflow-hidden rounded-[18px] border border-[#E3EBE6] bg-white">
      <Skeleton height={132} borderRadius={0} />
      <View className="gap-2 px-3 py-3">
        <Skeleton width="78%" height={17} />
        <Skeleton width="55%" height={13} />
        <Skeleton width="45%" height={21} />
      </View>
    </View>
  );
}

export function FarmCardSkeleton() {
  return (
    <View className="flex-row gap-3 rounded-[18px] border border-[#E3EBE6] bg-white p-3">
      <Skeleton width={88} height={88} borderRadius={14} />
      <View className="flex-1 justify-center gap-3">
        <Skeleton width="70%" height={18} />
        <Skeleton width="92%" height={14} />
        <Skeleton width="45%" height={18} borderRadius={999} />
      </View>
    </View>
  );
}

export type { SkeletonProps };
