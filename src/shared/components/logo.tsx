/* eslint-disable @next/next/no-img-element -- the custom media loader cannot emit a density srcset for this local asset */

const Logo = () => {
  return (
    <div className="rounded-full">
      <img
        src="/logo-48.webp"
        srcSet="/logo-48.webp 1x, /logo-96.webp 2x, /logo-144.webp 3x"
        width={48}
        height={48}
        alt="Pictures Writers"
        loading="eager"
        decoding="async"
        className="h-12 w-12 object-contain"
      />
    </div>
  );
};

export default Logo;
