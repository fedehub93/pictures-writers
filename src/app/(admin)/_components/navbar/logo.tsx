import Image from "next/image";

interface LogoProps {
  logoUrl?: string | null;
}

const Logo = ({ logoUrl }: LogoProps) => {
  const imageUrl = logoUrl || "/logo.svg";

  return <Image height={60} width={60} alt="logo" src={imageUrl} unoptimized />;
};

export default Logo;
