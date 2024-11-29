import { HeroSection } from "./_components/hero-section";
import { CreativeFeatures } from "./_components/services";
import { LatestNews } from "./_components/latest-news";
import { ContactUs } from "./_components/contact-us";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <CreativeFeatures />
      <LatestNews />
      <ContactUs />
    </>
  );
};

export default HomePage;
