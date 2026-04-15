import MeasurementsHistory from "@/components/station/MeasurementsHistory";

type Props = {
  params: Promise<{ id: string }>;
};

const LABELS: Record<string, string> = {
  pm1: "PM1",
  pm25: "PM2.5",
  pm10: "PM10",
  no2: "NO2",
  so2: "SO2",
  co: "CO",
  o3: "O3",
  caqi: "CAQI",
};

function formatLabel(key: string): string {
  return LABELS[key] ?? key.replaceAll("_", " ").toUpperCase();
}

function formatValue(value: unknown): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }

  return String(value);
}

export default async function StationPage({ params }: Props) {
  const { id } = await params;

  const res = await fetch(
    `http://46.225.27.182:8002/postgre/measurements/${id}`,
  );
  const history = (await res.json()) as Record<string, unknown>[];
  const data = history.at(-1) ?? {};

  const cards = Object.entries(data).filter(
    ([key, value]) =>
      !["id", "station_id", "timestamp"].includes(key) &&
      typeof value === "number",
  );

  return (
    <main className="min-h-screen bg-[#0a0b0f] p-6 text-zinc-100">
      <section className="max-w-3xl rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-4 shadow-2xl backdrop-blur-sm">
        <header className="mb-4">
          <h1 className="text-lg font-semibold tracking-wide">Station {id}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ostatni pomiar: {String(data.timestamp ?? "-")}
          </p>
        </header>

        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-7">
          {cards.map(([key, value]) => (
            <article
              key={key}
              className="relative flex aspect-square items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/70 p-1"
            >
              <p className="absolute left-1 top-1 text-[9px] uppercase leading-none tracking-wide text-zinc-500">
                {formatLabel(key)}
              </p>
              <p className="text-base font-semibold leading-none text-zinc-50">
                {formatValue(value)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <MeasurementsHistory history={history} />
    </main>
  );
}
