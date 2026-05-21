"use client";

import StickyBox from "react-sticky-box";

const StickyWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <StickyBox offsetTop={100} offsetBottom={20}>
      {children}
    </StickyBox>
  );
};

export default StickyWrapper;
