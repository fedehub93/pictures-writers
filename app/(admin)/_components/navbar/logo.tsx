import Link from "next/link";
import Image from "next/image";

const Logo = () => {
  return (
    <Link href="/admin/dashboard">
      <Image height={130} width={130} alt="logo" src="/logo.svg" />
    </Link>
  );
};

export default Logo;
