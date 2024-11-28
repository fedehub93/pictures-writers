import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <div className="bg-secondary rounded-full">
      <Image height={48} width={48} alt="logo" src="/logo.png" />
    </div>
  );
};

export default Logo;
