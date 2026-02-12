import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { type ReactNode } from "react";

interface NotFoundCardProps {
  children?: ReactNode;
  name?: string;
  message?: string;
  className?: string;
}

const NotFoundCard = ({
  children,
  name = "Data",
  message = "",
  className = "",
}: NotFoundCardProps) => {
  const router = useRouter()
  const canGoBack = useCanGoBack()
   
  const defaultMessage = `The requested ${name.toLowerCase()} could not be found.`;

  return (
    <Card className={`w-full mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-red-500">{`${name} Not Found`}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-gray-600">{message || defaultMessage}</p>
        {children}
        {canGoBack ? (
            <button onClick={() => router.history.back()}>Go back</button>
          ) : null}
      </CardContent>
    </Card>
  );
};

export default NotFoundCard;