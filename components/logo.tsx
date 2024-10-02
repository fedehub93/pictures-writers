import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" prefetch={true}>
      <Image height={48} width={48} alt="logo" src="/logo.png" />
    </Link>
  );
};

export default Logo;
