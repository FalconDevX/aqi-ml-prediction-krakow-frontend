import MeasurementsHistory from "@/components/station/MeasurementsHistory";
import { getMetricUnit } from "@/lib/metricUnits";
import stations from "@/public/stations.json";

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

  const stationIdNum = Number(id);
  const stationMeta = stations.find((s) => s.id === stationIdNum);
  const stationTitle = stationMeta
    ? `${stationMeta.name} – Stacja ${id}`
    : `Stacja ${id}`;

  const res = await fetch(
    `http://46.225.27.182:8002/postgre/measurements/${id}`,
    { next: { revalidate: 60 } },
  );
  const history = (await res.json()) as Record<string, unknown>[];
  const data = history.at(-1) ?? {};

  const cards = Object.entries(data).filter(
    ([key, value]) =>
      !["id", "station_id", "timestamp"].includes(key) &&
      typeof value === "number",
  );

  return (
    <main className="h-full overflow-y-auto bg-[#0a0b0f] p-6 text-zinc-100">
      <section className="max-w-3xl rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-4 shadow-2xl backdrop-blur-sm">
        <header className="mb-4">
          <h1 className="text-lg font-semibold tracking-wide">{stationTitle}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ostatni pomiar: {String(data.timestamp ?? "-")}
          </p>
        </header>

        <div className="grid max-w-full grid-cols-[repeat(4,5rem)] gap-1 sm:grid-cols-[repeat(5,5rem)] md:grid-cols-[repeat(7,5rem)]">
          {cards.map(([key, value]) => {
            const unit = getMetricUnit(key);
            return (
              <article
                key={key}
                className="relative flex aspect-square w-full flex-col items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/70 p-1"
              >
                <p className="absolute left-1 top-1 text-[10px] uppercase leading-none tracking-wide text-zinc-500">
                  {formatLabel(key)}
                </p>
                <p className="text-sm font-semibold leading-none text-zinc-50">
                  {formatValue(value)}
                </p>
                {unit ? (
                  <p className="mt-0.5 text-[9px] leading-none text-zinc-500">
                    {unit}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <MeasurementsHistory history={history} stationId={id} />
    </main>
  );
}
