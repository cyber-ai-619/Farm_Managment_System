import logo from "../assets/logos/logo.jpg";

function Logo({ className = "" }) {
  return <img className={`ffms-logo ${className}`} src={logo} alt="FFMS logo" />;
}

export default Logo;
