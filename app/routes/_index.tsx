import type { MetaFunction } from "@remix-run/node";
import { useEventStream } from "~/utils/sse";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const time = useEventStream("/sse/time", {
    returnLatestOnly: true,
    deserialize: (data) => {
      return new Date(data);
    },
  });

  return (
    <div className="flex h-screen items-center justify-center">
      <pre>{JSON.stringify(time, null, 2)}</pre>
    </div>
  );
}
