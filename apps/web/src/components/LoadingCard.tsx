import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface LoadingCardProps {
  title?: string;
  skeletonCount?: number;
  className?: string;
}

export const LoadingCard = ({
  title = "Loading data...",
  skeletonCount = 3,
  className = "",
}: LoadingCardProps) => {
  return (
    <Card className={`w-full mx-auto ${className}`}>
      {/* <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader> */}
      <CardContent className="flex flex-col gap-4">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
};