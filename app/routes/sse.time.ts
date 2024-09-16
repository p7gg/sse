import { LoaderFunction } from "@remix-run/node";
import { eventStream } from "~/utils/sse.server";

export const loader: LoaderFunction = ({ request }) => {
  return eventStream(request, (send) => {
    const interval = setInterval(() => {
      send(JSON.stringify(new Date().toLocaleString("en-US")));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });
};
