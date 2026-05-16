import { useCallback, useMemo, useRef, useState } from "react";

type NdefRecordLike = {
  recordType?: string;
  data?: ArrayBuffer | DataView | null;
};

type NdefMessageLike = {
  records?: NdefRecordLike[];
};

type NdefReadingEventLike = Event & {
  message?: NdefMessageLike;
};

type NdefReaderLike = {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  addEventListener: (
    type: "reading" | "readingerror",
    listener: (event: Event) => void,
  ) => void;
};

type NdefReaderCtor = new () => NdefReaderLike;

type WindowWithNfc = Window & {
  NDEFReader?: NdefReaderCtor;
};

function toUint8Array(data: ArrayBuffer | DataView | null | undefined) {
  if (!data) {
    return null;
  }

  if (data instanceof DataView) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  return new Uint8Array(data);
}

function decodeRecord(record: NdefRecordLike): string | null {
  const bytes = toUint8Array(record.data);
  if (!bytes || bytes.length === 0) {
    return null;
  }

  const decoder = new TextDecoder("utf-8", { fatal: false });
  const raw = decoder.decode(bytes).trim();
  if (!raw) {
    return null;
  }

  if (record.recordType === "text" || record.recordType === "url") {
    return raw;
  }

  return raw;
}

export function useNfc() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastPayload, setLastPayload] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const isSupported = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean((window as WindowWithNfc).NDEFReader);
  }, []);

  const stopScan = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    setError(null);

    if (!isSupported) {
      setError("WebNFC não suportado neste dispositivo/navegador.");
      return;
    }

    if (isScanning) {
      return;
    }

    try {
      const Reader = (window as WindowWithNfc).NDEFReader;
      if (!Reader) {
        setError("Leitor NFC indisponível.");
        return;
      }

      const reader = new Reader();
      const controller = new AbortController();
      abortRef.current = controller;

      reader.addEventListener("reading", (event: Event) => {
        const readingEvent = event as NdefReadingEventLike;
        const records = readingEvent.message?.records ?? [];

        for (const record of records) {
          const payload = decodeRecord(record);
          if (!payload) {
            continue;
          }

          setLastPayload(payload);
          setError(null);
          return;
        }

        setError("Tag NFC lida, mas sem payload textual utilizável.");
      });

      reader.addEventListener("readingerror", () => {
        setError("Falha ao ler a tag NFC. Tente aproximar novamente.");
      });

      await reader.scan({ signal: controller.signal });
      setIsScanning(true);
    } catch (scanError) {
      setIsScanning(false);
      setError(
        scanError instanceof Error
          ? scanError.message
          : "Não foi possível iniciar leitura NFC.",
      );
    }
  }, [isScanning, isSupported]);

  return {
    isSupported,
    isScanning,
    lastPayload,
    error,
    startScan,
    stopScan,
  };
}
