import veryDrySoil from "../assets/verydrysoil.png"
import drySoil from "../assets/drysoil.png"
import normalSoil from "../assets/normalsoil.png"
import wetSoil from "../assets/wetsoil.png"
import veryWetSoil from "../assets/verywetsoil.png"

/**
 * Maps a moisture value (0-100) to the appropriate soil image
 * Values are distributed across ranges with smooth transitions
 * @param value - Moisture value (0-100)
 * @returns Image source for the corresponding moisture level
 */
const rangeToImage = (value: number): [string, string] => {
    // Ensure value is within bounds
    const clampedValue = Math.max(0, Math.min(100, value));
    
    // Define transition points
    if (clampedValue < 20) {
      return [veryDrySoil, "Very Dry"];
    } else if (clampedValue < 40) {
      return [drySoil, "Dry"];
    } else if (clampedValue < 60) {
      return [normalSoil, "Normal"];
    } else if (clampedValue < 80) {
      return [wetSoil, "Wet"];
    } else {
      return [veryWetSoil, "Very Wet"];
    }
  };
export const SoilMoisture = ({ hydro, img, label }: { label?: string, hydro?: number, img: string }) => {
    const [imageSrc, textualDescription] = rangeToImage(hydro??13);
    return (<div className="w-100 flex-center relative">
        <img src={img} style={{ width: "250px" }} alt="Plant" className="tankPlant" />
        <div className="tankImage" 
        style={{
            background: `url(${imageSrc})`,
            backgroundSize: 'cover 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'top',
            height: '100%', // Make sure this is set
            minHeight: "45vh",
            width: '100%',  // Make sure this is set
        }} 
        ></div>
        <div className="tankText textContrast">
            <div className="label">
                {label}
            </div>
            <div>{textualDescription}</div>
            <div className="value">{Number(hydro ?? 13).toFixed(2)}%</div></div>

    </div>)
}