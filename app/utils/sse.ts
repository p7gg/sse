import { useEffect, useRef, useState } from "react";

export type DeserializeFn = (raw: string) => any;

export type EventOptions<
  TReturnLatest extends boolean,
  TDeserialized extends DeserializeFn | never
> = {
  maxEventRetention?: number;
  channel?: string;
  returnLatestOnly?: TReturnLatest;
  deserialize?: TDeserialized;
};

export type Deserialized<TDeserialized extends DeserializeFn> =
  undefined extends TDeserialized ? string : ReturnType<TDeserialized>;

export type UseSubscribeReturn<
  TReturnLatest extends boolean,
  TDeserialized extends DeserializeFn | never
> = TReturnLatest extends true
  ? Deserialized<TDeserialized> | null
  : Deserialized<TDeserialized>[] | null;

function addNewEvent(event: any, previous: any[], maxEvents: number) {
  if (previous.length > maxEvents) {
    return [...previous.shift(), event];
  }
  return [...previous, event];
}

export function useSubscribe<
  TReturnLatest extends boolean,
  TDeserialize extends DeserializeFn | never
>(
  eventSource: EventSource | undefined,
  options?: EventOptions<TReturnLatest, TDeserialize>
): UseSubscribeReturn<TReturnLatest, TDeserialize> {
  const [data, setData] =
    useState<UseSubscribeReturn<TReturnLatest, TDeserialize>>(null);

  useEffect(() => {
    if (!eventSource) return;

    const maxEventRetention = options?.maxEventRetention ?? 50;
    const channel = options?.channel ?? "message";

    function handler(event: MessageEvent) {
      setData((previous) => {
        const newEventData = options?.deserialize
          ? options.deserialize(event.data)
          : event.data;

        if (options?.returnLatestOnly) {
          return newEventData;
        }

        if (Array.isArray(previous)) {
          return addNewEvent(newEventData, previous, maxEventRetention);
        }

        if (!previous) {
          return addNewEvent(newEventData, [], maxEventRetention);
        }

        return previous;
      });
    }

    const removeListener = () => {
      eventSource.removeEventListener(channel ?? "message", handler);
    };

    const addListener = () => {
      eventSource.addEventListener(channel ?? "message", handler);
    };

    removeListener();
    addListener();

    return () => {
      removeListener();
    };
  }, [
    options?.channel,
    options?.deserialize,
    options?.maxEventRetention,
    options?.returnLatestOnly,
    eventSource,
  ]);

  return data;
}

export function useEventStream<
  TReturnLatest extends boolean,
  TDeserialize extends DeserializeFn | never
>(url: string, options?: EventOptions<TReturnLatest, TDeserialize>) {
  const createdRef = useRef(false);
  const [source, setSource] = useState<EventSource | undefined>(undefined);

  useEffect(() => {
    if (createdRef.current) return;
    let _source = sources.get(url) || new EventSource(url);
    sources.set(url, _source);
    setSource(_source);
    createdRef.current = true;
  }, [url]);

  return useSubscribe<TReturnLatest, TDeserialize>(source, options);
}

const sources = new Map<string, EventSource>();
