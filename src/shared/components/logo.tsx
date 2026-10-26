const Logo = () => {
  return (
    <div className="rounded-full">
      {/* eslint-disable-next-line @next/next/no-img-element -- the custom media loader cannot emit a density srcset for this local asset */}
      <img
        src="/logo-48.webp"
        srcSet="/logo-48.webp 1x, /logo-96.webp 2x, /logo-144.webp 3x"
        width={48}
        height={48}
        alt="Pictures Writers"
        loading="eager"
        decoding="async"
        className="object-contain"
      />
    </div>
  );
};

export default Logo;
