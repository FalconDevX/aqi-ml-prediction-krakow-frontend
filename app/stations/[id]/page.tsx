type Props = {
  params: Promise<{ id: string }>;
};

export default async function StationPage({ params }: Props) {
    const { id } = await params;
  
    const res = await fetch(`http://46.225.27.182:8002/stations/current/${id}`);
    const data = await res.json();
  
    return (
      <div className="text-white">
        <h1>Station {id}</h1>
  
        {Object.entries(data).map(([key, value]: [string, any]) =>
          key !== "CAQI" ? (
            <div key={key}>
              <h2>
                {key}: {JSON.stringify(value)}
              </h2>
            </div>
          ) : (
            <div key={key}>
              <h2>{key}</h2>
  
              {value.map((item: { [x: string]: string; }, i: number) => (
                <div key={i} className="ml-4">
                  {Object.entries(item).map(([k, v]) => (
                    <div key={k}>
                      {k}: {String(v)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  }
