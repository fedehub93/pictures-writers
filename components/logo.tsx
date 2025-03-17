import Image from "next/image";

const Logo = () => {
  return (
    <div className="rounded-full">
      <Image height={48} width={48} alt="logo" src="/logo.png" />
    </div>
  );
};

export default Logo;
