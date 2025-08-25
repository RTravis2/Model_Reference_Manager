
import watts from "./assets/watts-logo.png";

export default function Logo({ size = 72 }) {
  return (
    <img
      src={watts}
      alt="Watts logo"
      className="logo logo-watts"
    />
  );
}
