export const Tank = ({ value, unit = "L", label, percValue }: { percValue?: number, value: number, label?: string, unit?: string }) => {
    console.log({value})
    return <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", padding: 16 }}>
        <div className="tank">
            <div className="tankOverlay" />
            <div className="tankPerc" style={{ height: `calc(${value}%)`  }}></div>

        </div>
        <div className="tankText">
            <div className="label">
                {label}
            </div>
            <div className="value">{convertPercToLitre(value).toFixed(2)}{unit}</div>
        </div>
    </div>
}

function convertPercToLitre(d: number) {
    
    // our tank capacity in litre
    const TANK_CAPACITY = 40;

    // map 0-100% to 0-40L
    return (d / 100) * TANK_CAPACITY;


}